const exp = require('express');
const router = exp.Router();
const { handleOwnersPage, handleOwnersData, handleOwnersOrofilePage, handleOwnerLogin, handleOwnerLoginPage, handleOwnerEditPage, handleOwnerEditSubmit } = require('../components/owners');
const { requireRole } = require('../middleware/auth');
const upload = require('../config/multer');
const mongoose = require('mongoose');
// Get owners page
router.get('/owner_registration', handleOwnersPage);

router.post('/owner_registration', upload.fields([{ name: 'proofOfOwnership' }, { name: 'profilePicture' }]), handleOwnersData);
router.get('/profile', requireRole('owner'), handleOwnersOrofilePage);
router.get('/edit-profile', requireRole('owner'), handleOwnerEditPage);
router.post('/edit-profile', requireRole('owner'), upload.fields([{ name: 'proofOfOwnership' }, { name: 'profilePicture' }]), handleOwnerEditSubmit);
router.get('/owner_login', handleOwnerLoginPage);
router.post('/owner_login', handleOwnerLogin);
router.get('/', async (req, res) => {
    try {
        const Owners = mongoose.model('ownersData');
        const owners = await Owners.find({}).lean();
        return res.json(owners);
    } catch (err) {
        console.error('Error fetching owners:', err);
        return res.status(500).json({ error: 'Server error fetching owners' });
    }
});
module.exports = router;    