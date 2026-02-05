const express = require('express');
const router = express.Router();
const Parking = require('../models/parking');
const { requireRole } = require('../middleware/auth');

// GET booking page for a parking lot
router.get('/', requireRole('user'), async (req, res) => {
  const { parkingId } = req.query;
  if (!parkingId) return res.status(400).send('Parking ID required');
  try {
    const parking = await Parking.findById(parkingId);
    if (!parking) return res.status(404).send('Parking not found');
    res.render('book', { parking });
  } catch (err) {
    res.status(500).send('Server error');
  }
});


// PayU integration
const crypto = require('crypto');
const payuConfig = require('../config/payu');

router.post('/', requireRole('user'), async (req, res) => {
  const { parkingId, slots, date, time } = req.body;
  if (!parkingId || !slots || !date || !time) return res.status(400).send('Missing booking details');
  try {
    const parking = await Parking.findById(parkingId);
    if (!parking) return res.status(404).send('Parking not found');

    // Calculate amount (for demo, assume 50 per slot)
    const amount = parseInt(slots) * parking.pricing.hourly;
    const txnid = 'txn' + Date.now();
    // Use only the parking name as productinfo (plain string, no JSON, no curly braces)
    const productinfo = String(parking.name || 'Parking Slot').trim();
    const firstname = 'TestUser'; // Replace with logged-in user info if available
    const email = 'test@example.com';


    // All user-defined fields (udf1-udf10) must be present, even if empty
    const udf1 = '';
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';
    const udf6 = '';
    const udf7 = '';
    const udf8 = '';
    const udf9 = '';
    const udf10 = '';
    // Hash string: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
    // All fields must be string and trimmed, and productinfo must match exactly in hash and form
    const hashString = [
      payuConfig.key,
      txnid,
      String(amount),
      productinfo,
      firstname,
      email,
      udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10,
      payuConfig.salt
    ].map(x => (x === undefined || x === null ? '' : String(x))).join('|');
    const hash = crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');

    // Render PayU payment form (auto-submit)
    res.send(`
      <html><body>
      <form id="payuForm" action="${payuConfig.base_url}" method="post">
        <input type="hidden" name="key" value="${payuConfig.key}" />
        <input type="hidden" name="txnid" value="${txnid}" />
        <input type="hidden" name="amount" value="${amount}" />
        <input type="hidden" name="productinfo" value="${productinfo}" />
        <input type="hidden" name="firstname" value="${firstname}" />
        <input type="hidden" name="email" value="${email}" />
        <input type="hidden" name="phone" value="9999999999" />
        <input type="hidden" name="surl" value="${payuConfig.success_url}" />
        <input type="hidden" name="furl" value="${payuConfig.failure_url}" />
        <input type="hidden" name="hash" value="${hash}" />
        <input type="hidden" name="udf1" value="${udf1}" />
        <input type="hidden" name="udf2" value="${udf2}" />
        <input type="hidden" name="udf3" value="${udf3}" />
        <input type="hidden" name="udf4" value="${udf4}" />
        <input type="hidden" name="udf5" value="${udf5}" />
        <input type="hidden" name="udf6" value="${udf6}" />
        <input type="hidden" name="udf7" value="${udf7}" />
        <input type="hidden" name="udf8" value="${udf8}" />
        <input type="hidden" name="udf9" value="${udf9}" />
        <input type="hidden" name="udf10" value="${udf10}" />
      </form>
      <script>document.getElementById('payuForm').submit();</script>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Server error');
  }
});



// Save booking after payment success
const Booking = require('../models/booking');

router.post('/success', async (req, res) => {
  // PayU will POST payment details here
  const {
    mihpayid, status, txnid, amount, productinfo, firstname, email, phone, hash, key, paymentId, parkingId, slots, date, time
  } = req.body;
  // For demo, skip hash verification. In production, always verify hash!
  try {
    // Extract parkingId, slots, date, time from productinfo or custom fields if needed
    // For demo, just show booking confirmation and save booking
    // You may want to parse productinfo for details
    const booking = new Booking({
      parkingId: req.body.parkingId || null,
      slots: req.body.slots || 1,
      date: req.body.date || '',
      time: req.body.time || '',
      user: firstname || email,
      amount: amount,
      paymentId: mihpayid || txnid,
      paymentStatus: 'success',
    });
    await booking.save();
    // Optionally, update available slots
    if (booking.parkingId) {
      await Parking.findByIdAndUpdate(booking.parkingId, { $inc: { availableSlots: -parseInt(booking.slots) } });
    }
    // Render themed booking success page
    return res.render('booking-submitted', { booking });
  } catch (err) {
    return res.status(500).send('<h2>Payment Successful, but booking failed to save.</h2>');
  }
});

// PayU payment failure
router.post('/failure', (req, res) => {
  res.send('<h2>Payment Failed</h2><p>Your payment was not successful. Please try again.</p>');
});

module.exports = router;
