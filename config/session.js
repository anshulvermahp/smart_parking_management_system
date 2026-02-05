const session = require("express-session");

module.exports = session({
    secret: process.env.SESSION_SECRET
    || "ThisisASecretKeyForSessionEncryption12345",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
});




