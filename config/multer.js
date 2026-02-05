const multer = require("multer");
const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg, .jpeg and .webp format allowed!"));
  }
});
