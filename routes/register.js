const exp = require("express");
const router = exp.Router()

const { newUser, registerUserPage } = require("../components/register")
const upload = require("../config/multer")

router.post("/register", upload.single('profilePicture'), newUser)
router.get("/register", registerUserPage)

module.exports = router