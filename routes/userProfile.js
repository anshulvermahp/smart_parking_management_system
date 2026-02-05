const exp = require('express');
const router = exp.Router();
const User = require('../models/register');
const Parking = require('../models/parking');
const upload = require('../config/multer');
const mongoose = require('mongoose');
const {handleUserProfilePage} = require('../components/userProfile');

// Get user profile by ID

router.get('/', handleUserProfilePage);

module.exports = router;