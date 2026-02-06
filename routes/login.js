const exp = require("express")
const router = exp.Router()
const { loginHandler, loginPage, logoutHandler } = require("../components/login")


router.post("/login", loginHandler)
router.get("/login", loginPage)
router.get("/logout", logoutHandler)


module.exports = router