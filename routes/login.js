const exp = require("express")
const router = exp.Router()
const { loginHandler, loginPage } = require("../components/login")


router.post("/login", loginHandler)
router.get("/login", loginPage)


module.exports = router