const mongoose = require('mongoose');
const Parking = require('./models/parking');
const Booking = require('./models/booking');
const path = require('path');
require("dotenv").config();

// Connect to DB (using the string from server.js for straightforwardness)
const dbUrl = "mongodb+srv://jivanand0526_db_user:M6Ap7fPqxa0sE5GJ@cluster0.rdchg95.mongodb.net/?appName=Cluster0";

mongoose.connect(dbUrl)
    .then(async () => {
        console.log("Connected to DB");

        console.log("--- Checking Parkings ---");
        const parkings = await Parking.find({});
        parkings.forEach(p => {
            console.log(`Parking: ${p.name}`);
            console.log(`  ID: ${p._id}`);
            console.log(`  Lat: ${p.latitude}, Long: ${p.longitude}`);
            console.log(`  Address: ${JSON.stringify(p.address)}`);
            console.log(`  MapLink: ${p.mapLink}`);
        });

        console.log("\n--- Checking Bookings ---");
        const bookings = await Booking.find({}).populate('parkingId');
        bookings.forEach(b => {
            console.log(`Booking for User: ${b.user}`);
            if (b.parkingId) {
                console.log(`  Parking: ${b.parkingId.name} (Lat: ${b.parkingId.latitude}, Long: ${b.parkingId.longitude})`);
            } else {
                console.log(`  Parking: NULL (Population failed)`);
            }
        });

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
