const mongoose = require('mongoose');
const Booking = require('./models/booking');
const User = require('./models/register');
const Parking = require('./models/parking');
require("dotenv").config();

const dbUrl = "mongodb+srv://jivanand0526_db_user:M6Ap7fPqxa0sE5GJ@cluster0.rdchg95.mongodb.net/?appName=Cluster0";

mongoose.connect(dbUrl)
    .then(async () => {
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`\nFound ${users.length} Users:`);
        users.forEach(u => console.log(` - ID: ${u._id}, Email: ${u.email}, Name: ${u.username}`));

        const bookings = await Booking.find({});
        console.log(`\nFound ${bookings.length} Bookings:`);
        bookings.forEach(b => console.log(` - BookingID: ${b._id}, UserID: ${b.user}, ParkingID: ${b.parkingId}`));

        // Check if there is a booking for each user
        if (users.length > 0 && bookings.length === 0) {
            console.log("\n⚠️ NO BOOKINGS FOUND. The 'Your Bookings' page will be empty.");
            console.log("Creating a dummy booking for the first user to test the view...");

            const firstUser = users[0];
            const firstParking = await Parking.findOne({});

            if (firstUser && firstParking) {
                const newBooking = new Booking({
                    parkingId: firstParking._id,
                    user: firstUser._id,
                    slots: 1,
                    date: new Date().toLocaleDateString(),
                    time: "12:00 PM",
                    amount: 50,
                    paymentId: "DUMMY_PAYMENT_" + Date.now(),
                    paymentStatus: 'success',
                    createdAt: new Date()
                });
                await newBooking.save();
                console.log(`✅ Created dummy booking for user ${firstUser.email} at parking ${firstParking.name}`);
            } else {
                console.log("❌ Could not create dummy booking: No users or parkings found.");
            }
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
