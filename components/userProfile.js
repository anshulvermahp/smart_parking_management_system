const users = require("../models/register");

const Booking = require("../models/booking");

const Owners = require("../models/owner");

async function handleUserProfilePage(req, res) {

    const userId = req.user?.id || req.user?._id;

    try {
        const user = await users.findById(userId).lean();
        if (!user) {
            return res.status(404).send("User not found");
        }

        // specific check: if user is marked as owner, verify they exist in owners collection
        if (user.owner) {
            const ownerRecord = await Owners.findOne({ email: user.email });
            if (!ownerRecord) {
                user.owner = false;
            }
        }

        const bookings = await Booking.find({ user: userId }).populate('parkingId');
        res.render("profile", { user, bookings });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Server error");
    }
}


module.exports = {

    handleUserProfilePage


}