require('dotenv').config();
const cloudinary = require('./config/cloudinary');

console.log("Testing Cloudinary Upload...");
console.log("Using Cloud Name:", process.env.CLOUDINARY_NAME);

// Try to upload a sample image from a public URL
cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
    { public_id: "test_upload_DO_NOT_DELETE" },
    function (error, result) {
        if (error) {
            console.error("❌ Upload Failed:", error);
        } else {
            console.log("✅ Upload Successful!");
            console.log("Image URL:", result.secure_url);
        }
    });
