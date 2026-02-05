const mongoose = require("mongoose");


const parkingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true }
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
  mapLink: String,
  images: [String],
  contact: {
    phone: String,
    email: String
  },
  pricing: {
    hourly: { type: Number, required: true },
    daily: Number,
    monthly: Number
  },
  operationalHours: {
    open: { type: String, required: true }, // e.g. "08:00"
    close: { type: String, required: true } // e.g. "22:00"
  },
  amenities: [String], // e.g. ["EV Charging", "CCTV", "Covered Parking"]
  security: {
    cctv: { type: Boolean, default: false },
    guard: { type: Boolean, default: false },
    gated: { type: Boolean, default: false }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Parking", parkingSchema);
