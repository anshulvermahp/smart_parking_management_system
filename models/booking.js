const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  parkingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parking', required: true },
  slots: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  amount: { type: Number, required: true },

  paymentId: { type: String },
  paymentStatus: { type: String, enum: ['success', 'failure'], default: 'success' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
