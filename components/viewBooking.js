const Booking = require("../models/booking");

async function viewBookingHandler(req, res) {
    try {
        console.log("ViewBooking Handler Accessed");

        // Handle case where req.user might be structured differently or missing
        const userId = req.user ? (req.user.id || req.user._id) : null;
        console.log("User ID from session:", userId);

        if (!userId) {
            console.log("No user ID found, redirecting to login");
            return res.redirect("/login");
        }

        const bookings = await Booking.find({ user: userId }).populate('parkingId').sort({ createdAt: -1 }); // Sorted by newest first
        console.log(`Found ${bookings.length} bookings for user ${userId}`);

        res.render("viewBookings", { bookings });
    } catch (err) {
        console.error("Error in viewBookingHandler:", err);
        res.status(500).send("Server Error");
    }
}

async function cancelBookingHandler(req, res) {
    try {
        const { bookingId } = req.body;
        console.log("Cancel Booking Request for ID:", bookingId);

        if (!bookingId) {
            return res.status(400).send("Booking ID is required");
        }

        await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
        console.log(`Booking ${bookingId} cancelled successfully`);

        res.redirect("/viewBooking");
    } catch (err) {
        console.error("Error in cancelBookingHandler:", err);
        res.status(500).send("Server Error");
    }
}

module.exports = { viewBookingHandler, cancelBookingHandler }; 