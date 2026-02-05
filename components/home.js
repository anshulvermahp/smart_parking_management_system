const users = require('../models/register');
const { getUser } = require('../config/auth');

async function homePage(req, res) {
    try {
        const token = req.cookies?.uuid;
        const decoded = getUser(token);
        let user = null;
        if (decoded && decoded.id) {
            user = await users.findById(decoded.id).lean();
        }
        res.render('home', { user });
    } catch (err) {
        console.error('Error rendering home page:', err);
        res.render('home', { user: null });
    }
}

module.exports = {
    homePage
}