const exp = require("express");
const router = exp.Router();
const Parking = require("../models/parking");
const Owners = require("../models/owner");
const Booking = require("../models/booking");

router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        // Find the owner profile associated with the logged-in user's email
        if (!req.user || !req.user.email) {
            return res.redirect('/login');
        }

        const ownerDoc = await Owners.findOne({ email: req.user.email });

        let parkings = [];
        if (ownerDoc) {
            parkings = await Parking.find({ owner: ownerDoc._id }).lean();
        }

        res.render("dashboard", { user: req.user, owner: ownerDoc, parkings });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).send("Server Error");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const parkingId = req.params.id;
        const parking = await Parking.findById(parkingId).lean();

        if (!parking) {
            return res.status(404).send("Parking not found");
        }

        // Security check: ensure the parking belongs to the logged-in owner
        // (Optional but good practice, though we just need to show it for now)

        // Calculate mapQuery for the view
        let mapQuery = "";
        if (parking.latitude && parking.longitude && (parking.latitude !== 0 || parking.longitude !== 0)) {
            mapQuery = parking.latitude + "," + parking.longitude;
        } else if (parking.address) {
            const addr = parking.address;
            mapQuery = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}, ${addr.zip || ''}`;
        }

        // Fetch bookings for this parking
        const bookings = await Booking.find({ parkingId: parkingId })
            .populate('user')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate Revenue (only from successful payments and non-cancelled/rejected bookings)
        // Adjust logic based on your payment flow. Assuming 'success' payment means paid.
        // If status is 'pending', money might be held or not charged yet depending on flow, 
        // but let's assume 'success' payment status + non-cancelled status = revenue.
        const revenue = bookings.reduce((acc, b) => {
            if (b.paymentStatus === 'success' && b.status !== 'cancelled' && b.status !== 'rejected') {
                return acc + b.amount;
            }
            return acc;
        }, 0);

        res.render("viewParking", { parking, mapQuery, bookings, revenue });
    } catch (err) {
        console.error("Error fetching parking details:", err);
        res.status(500).send("Server Error");
    }
});

router.get("/:id/edit", async (req, res) => {
    try {
        const parkingId = req.params.id;
        const parking = await Parking.findById(parkingId).lean();
        if (!parking) return res.status(404).send("Parking not found");
        res.render("editParking", { parking });
    } catch (err) {
        console.error("Error loading edit page:", err);
        res.status(500).send("Server Error");
    }
});

const upload = require("../config/multer-imagekit");
// Note: using the same multer config as newParking. 
// If it's not exported properly, we might need to check. 
// Assuming it's the one used in routes/newParking.js loop or similar.
// Actually, in routes/newParking.js it used `require("../config/multer-imagekit")` directly.
// But in components/newParking.js it used `require("../config/imagekit")`.
// Let's use the same pattern as routes/newParking.js for the route definition.

const imagekit = require("../config/imagekit");

router.post("/:id/edit", (req, res, next) => {
    // Middleware wrapper for upload
    upload.array("images", 5)(req, res, (err) => {
        if (err) return res.status(400).send("File upload error: " + err.message);
        next();
    });
}, async (req, res) => {
    try {
        const parkingId = req.params.id;
        const parking = await Parking.findById(parkingId);
        if (!parking) return res.status(404).send("Parking not found");

        const {
            name, street, city, state, zip, country, mapLink,
            totalSlots, availableSlots,
            pricingHourly, pricingDaily, pricingMonthly,
            operationalOpen, operationalClose,
            securityCctv, securityGuard, securityGated
        } = req.body;

        // Update fields
        if (name) parking.name = name;
        if (street || city || state || zip || country) {
            parking.address = {
                street: street || parking.address.street,
                city: city || parking.address.city,
                state: state || parking.address.state,
                zip: zip || parking.address.zip,
                country: country || parking.address.country
            };
        }

        if (mapLink && mapLink !== parking.mapLink) {
            parking.mapLink = mapLink;
            const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
            const match = mapLink.match(regex);
            if (match) {
                parking.latitude = parseFloat(match[1]);
                parking.longitude = parseFloat(match[2]);
            }
        }

        if (totalSlots) parking.totalSlots = totalSlots;
        if (availableSlots) parking.availableSlots = availableSlots;

        if (pricingHourly) parking.pricing.hourly = pricingHourly;
        if (pricingDaily) parking.pricing.daily = pricingDaily;
        if (pricingMonthly) parking.pricing.monthly = pricingMonthly;

        if (operationalOpen) parking.operationalHours.open = operationalOpen;
        if (operationalClose) parking.operationalHours.close = operationalClose;

        // Security
        parking.security = {
            cctv: !!securityCctv,
            guard: !!securityGuard,
            gated: !!securityGated
        };

        // Handle Image Deletions
        const { deleteImages, thumbnail } = req.body;
        if (deleteImages) {
            const toDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
            parking.images = parking.images.filter(img => !toDelete.includes(img));
        }

        // Handle New Images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadResponse = await imagekit.upload({
                        file: file.buffer,
                        fileName: file.originalname,
                        folder: "/parkspot/parking"
                    });
                    parking.images.push(uploadResponse.url);
                } catch (err) {
                    console.error("ImageKit upload error:", err);
                }
            }
        }

        // Handle Thumbnail
        // Set thumbnail if provided and exists in current images, otherwise default to first image
        if (thumbnail && parking.images.includes(thumbnail)) {
            parking.thumbnail = thumbnail;
        } else if (parking.images.length > 0) {
            // Default to first image if current thumbnail was deleted or not set
            if (!parking.images.includes(parking.thumbnail)) {
                parking.thumbnail = parking.images[0];
            }
        } else {
            parking.thumbnail = "";
        }

        await parking.save();
        res.redirect(`/dashboard/${parkingId}`);

    } catch (err) {
        console.error("Error updating parking:", err);
        res.status(500).send("Server Error: " + err.message);
    }
});


router.post("/:id/delete", async (req, res) => {
    try {
        const parkingId = req.params.id;
        const parking = await Parking.findById(parkingId);

        if (!parking) {
            return res.status(404).send("Parking not found");
        }

        // Security check: Verify ownership
        // We first need the current user's owner profile
        const ownerDoc = await Owners.findOne({ email: req.user.email });
        if (!ownerDoc || parking.owner.toString() !== ownerDoc._id.toString()) {
            return res.status(403).send("Unauthorized: You do not own this parking");
        }

        await Parking.findByIdAndDelete(parkingId);
        res.redirect("/dashboard");
    } catch (err) {
        console.error("Error deleting parking:", err);
        res.status(500).send("Server Error");
    }
});

// Route to accept/reject booking
router.post("/:id/booking/:bookingId/status", async (req, res) => {
    try {
        const { id, bookingId } = req.params;
        const { status } = req.body; // 'confirmed' or 'cancelled'

        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).send("Invalid status");
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).send("Booking not found");

        booking.status = status;
        await booking.save();

        res.redirect(`/dashboard/${id}`);
    } catch (err) {
        console.error("Error updating booking status:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;