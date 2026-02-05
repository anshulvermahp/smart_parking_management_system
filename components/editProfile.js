const User = require('../models/register');
const imagekit = require('../config/imagekit');

async function editProfilePage(req, res) {
    const userId = req.user?.id || req.user?._id;
    try {
        const user = await User.findById(userId);   
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("editProfile", { user });
    } catch (error) {
        console.error("Error fetching user profile for edit:", error);
        res.status(500).send("Server error");
    }
}
async function updateProfile(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { username, email, phoneNumber, password, oldPassword } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        // Update basic fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        // Handle password change if requested
        if (password) {
            if (!oldPassword) return res.status(400).send('Old password is required to change password');
            if (String(oldPassword) !== String(user.password)) return res.status(400).send('Old password is incorrect');
            if (String(password).length < 6) return res.status(400).send('New password must be at least 6 characters');
            user.password = password;
        }

        // Handle profile picture upload via ImageKit (multer uses memoryStorage)
        if (req.file) {
            try {
                const file64 = req.file.buffer.toString('base64');
                const uploadResult = await new Promise((resolve, reject) => {
                    imagekit.upload({
                        file: `data:${req.file.mimetype};base64,${file64}`,
                        fileName: req.file.originalname
                    }, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    })
                });
                user.profilePicture = uploadResult.url || user.profilePicture;
            } catch (err) {
                console.error('Image upload failed during profile edit:', err);
                if (err.message && err.message.includes('File too large')) {
                    return res.status(400).send('Profile image too large (max 2MB)');
                }
            }
        }

        await user.save();
        // Show a success page after updating profile
        return res.render('profile-updated', { user });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send("Server error");
    }
}
module.exports = {
    editProfilePage,
    updateProfile
};