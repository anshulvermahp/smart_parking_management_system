const exp = require('express');
const router = exp.Router();

const upload = require('../config/multer');

const { editProfilePage, updateProfile } = require('../components/editProfile');

router.get('/edit-profile', editProfilePage);
router.post('/edit-profile', upload.single('profilePicture'), updateProfile);
module.exports = router;