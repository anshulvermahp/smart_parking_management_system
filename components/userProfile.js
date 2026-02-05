const users = require("../models/register");



async function handleUserProfilePage(req, res) {

    const userId = req.user?.id || req.user?._id;

    try {
        const user = await users.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("profile", { user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Server error");
    }
}
module.exports = {

    handleUserProfilePage


}