const exp = require("express")
const router = exp.Router()
const { viewBookingHandler, cancelBookingHandler } = require("../components/viewBooking")


router.get("/", viewBookingHandler)
router.post("/cancel", cancelBookingHandler)


module.exports = router