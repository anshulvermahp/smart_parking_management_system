const express = require("express");
const path = require("path");
const session = require("./config/session");
const app = express();
const cookiesParser = require("cookie-parser")
const { restricToLoggedInUserOnly } = require("./middleware/auth");
// async function name() {
//    const Parking = require("./models/parking");
// const data = require("./parking-demo.json");

// await Parking.insertMany(data);

// }
// name();
/* =======================
   View Engine
======================= */
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

/* =======================
   Middlewares
======================= */
app.use(session)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookiesParser())

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));
require("dotenv").config();

/* =======================
   Database
======================= */
const ConnectDB = require("./connection/db");
ConnectDB(
   "mongodb+srv://jivanand0526_db_user:M6Ap7fPqxa0sE5GJ@cluster0.rdchg95.mongodb.net/?appName=Cluster0"
);

/* =======================
   Routes
======================= */
const homepage = require("./routes/home");
const register = require("./routes/register");
const login = require("./routes/login");
const mapView = require("./routes/map");
const newParking = require("./routes/newParking");
const userProfile = require("./routes/userProfile");
const editProfile = require("./routes/editProfile");
const owners = require("./routes/owners");
// Public routes


app.use("/", homepage);
app.use("/", register);
app.use("/", login);
app.use("/", mapView);
app.use("/profile", restricToLoggedInUserOnly, userProfile,editProfile);
app.use("/profile", editProfile);
const bookRoute = require("./routes/book");
app.use("/book", restricToLoggedInUserOnly, bookRoute);
app.use("/owners", owners);

// Admin routes
app.use("/admin", restricToLoggedInUserOnly, newParking);

/* =======================
   Error Handling
======================= */
app.use((err, req, res, next) => {
   console.error("Server Error:", err);
   res.status(err.status || 500).send("Something went wrong: " + (err.message || JSON.stringify(err)));
});

/* =======================
   Server
======================= */
app.listen(3000, () => {
   console.log("🚀 Server running on http://localhost:3000");
});
