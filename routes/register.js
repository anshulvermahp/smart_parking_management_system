const exp = require("express");
const router = exp.Router()

const { newUser, registerUserPage,usersapi } = require("../components/register")
const upload = require("../config/multer")

router.post("/register", upload.single('profilePicture'), newUser)
router.get("/register", registerUserPage)
router.get("/api/users", usersapi)


module.exports = router