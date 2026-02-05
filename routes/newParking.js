const exp = require("express");
const router = exp.Router()
const { newParkingPage, addArea } = require("../components/newParking")
const { requireRole } = require("../middleware/auth");
const upload = require("../config/multer-imagekit");
router.get("/add-parking", requireRole('owner'), newParkingPage)
router.post("/add-parking", requireRole('owner'), (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => {
        if (err) {
            console.error("File upload error:", err);
            return res.status(400).send("File upload error: " + (err.message || err));
        }
        next();
    });
}, addArea);

module.exports = router