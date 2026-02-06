const exp = require("express")
const router = exp.Router()
const { homePage } = require("../components/home")

router.get("/", homePage)

module.exports = router