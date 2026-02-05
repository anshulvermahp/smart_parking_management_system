const ownersData = require('../models/owner');
const imagekit = require('../config/imagekit');
const { setUser, getUser } = require('../config/auth');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function handleOwnersPage(req, res) {
    res.render('owner');
}

async function handleOwnersData(req, res) {
    const Users = require('../models/register');
    const { name, username, contactNumber, email } = req.body;

    // determine uploaded files
    const proofFile = req.files && req.files['proofOfOwnership'] && req.files['proofOfOwnership'][0];
    const profileFile = req.files && req.files['profilePicture'] && req.files['profilePicture'][0];

    // minimal validation
    if (!(name || username)) return res.status(400).send('Name is required');
    if (!contactNumber) return res.status(400).send('Contact number is required');
    if (!email) return res.status(400).send('Email is required');

    // upload helper
    async function uploadFile(file) {
        if (!file) return '';
        const file64 = file.buffer.toString('base64');
        try {
            const uploadResult = await new Promise((resolve, reject) => {
                imagekit.upload({ file: `data:${file.mimetype};base64,${file64}`, fileName: file.originalname }, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            return uploadResult.url || '';
        } catch (ikErr) {
            console.error('ImageKit upload failed, falling back to local save:', ikErr);
            try {
                const imagesDir = path.join(__dirname, '..', 'public', 'images');
                if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
                const savePath = path.join(imagesDir, file.originalname);
                fs.writeFileSync(savePath, file.buffer);
                return `/images/${file.originalname}`;
            } catch (fsErr) {
                console.error('Local save failed:', fsErr);
                return file.originalname || '';
            }
        }
    }

    const [proofUrl, profileUrl] = await Promise.all([uploadFile(proofFile), uploadFile(profileFile)]);

    if (!proofUrl) return res.status(400).send('Proof of ownership is required');

    try {
        // prevent duplicate owner entry (check email or contact number)
        const existingOwner = await ownersData.findOne({ $or: [{ email }, { contactNumber }] }).lean();
        // if user is logged in, link owner to existing user
        const token = req.cookies?.uuid;
        let loggedUser = null;
        if (token) {
            const { getUser } = require('../config/auth');
            const decoded = getUser(token);
            if (decoded && decoded.id) loggedUser = await Users.findById(decoded.id);
        }

        if (existingOwner) {
            // owner already exists; if logged-in user, ensure user's owner flag is set
            if (loggedUser) {
                if (!loggedUser.owner) {
                    loggedUser.owner = true;
                    if (profileUrl) loggedUser.profilePicture = profileUrl;
                    await loggedUser.save();
                    const { setUser } = require('../config/auth');
                    const jwtToken = setUser(loggedUser);
                    res.cookie('uuid', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
                }
                return res.send('Owner profile exists; linked to your account');
            }

            const conflicts = [];
            if (existingOwner.email === email) conflicts.push('email');
            if (existingOwner.contactNumber === contactNumber) conflicts.push('phone number');
            const conflictMsg = conflicts.length ? `Owner profile already registered with this ${conflicts.join(' and ')}` : 'Owner profile already registered';
            return res.status(409).send(conflictMsg);
        }

        // create owner document
        const ownerPayload = {
            username: (username || name).trim(),
            contactNumber,
            email,
            password: (loggedUser && loggedUser.password) || req.body.password || '',
            proofOfOwnership: proofUrl,
            profilePicture: profileUrl
        };

        const newOwner = new ownersData(ownerPayload);
        await newOwner.save();

        // if logged in, mark user as owner and refresh cookie
        if (loggedUser) {
            loggedUser.owner = true;
            if (profileUrl) loggedUser.profilePicture = profileUrl;
            await loggedUser.save();
            const { setUser } = require('../config/auth');
            const jwtToken = setUser(loggedUser);
            res.cookie('uuid', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.send('Owner registered and linked to your user account');
        }

        return res.send('Owner registered successfully');
    } catch (error) {
        console.error('Error saving owner data:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).send('Validation error: ' + Object.values(error.errors).map(e => e.message || e.path).join(', '));
        }
        return res.status(500).send('Server error');
    }
}
async function handleOwnersOrofilePage(req, res) {
    const token = req.cookies?.uuid || req.cookies?.ownertoken;
    const decoded = getUser(token);
    if (!decoded) {
        return res.redirect('/owners/owner_login');
    }

    try {
        let owner = null;
        if (decoded.id) {
            owner = await ownersData.findById(decoded.id).lean();
        }
        if (!owner && decoded.email) {
            owner = await ownersData.findOne({ email: decoded.email }).lean();
        }
        if (!owner) {
            return res.status(404).send('Owner not found');
        }
        // compute displayable urls for profile picture and proof
        owner.profileUrl = null;
        if (owner.profilePicture) {
            const p = owner.profilePicture.toString();
            if (p.startsWith('http') || p.startsWith('/')) owner.profileUrl = p;
            else owner.profileUrl = `/images/${p}`;
        }
        owner.proofUrl = null;
        if (owner.proofOfOwnership) {
            const p2 = owner.proofOfOwnership.toString();
            if (p2.startsWith('http') || p2.startsWith('/')) owner.proofUrl = p2;
            else owner.proofUrl = `/images/${p2}`;
        }
        return res.render('ownerProfile', { owner });
    } catch (err) {
        console.error('Error fetching owner profile:', err);
        return res.status(500).send('Server error');
    }
}

async function handleOwnerLoginPage(req, res) {

    res.render('ownerLoging');
}
async function handleOwnerLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
    try {
        const owner = await ownersData.findOne({ email, password }).lean();
        if (!owner) {
            return res.status(401).send('Invalid email or password');
        }
        const jwtToken = setUser(owner);
        // use the same cookie name as user login so auth helpers/middleware can decode it
        res.cookie('uuid', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.redirect('/owners/profile');
    }
    catch (error) {
        console.error("Unexpected error during owner login:", error)
        return res.status(500).send("Unexpected server error")
    }
}



async function handleOwnerEditPage(req, res) {
    const token = req.cookies?.uuid || req.cookies?.ownertoken;
    const decoded = getUser(token);
    if (!decoded) return res.redirect('/owners/owner_login');

    try {
        let owner = null;
        if (decoded.id) owner = await ownersData.findById(decoded.id).lean();
        if (!owner && decoded.email) owner = await ownersData.findOne({ email: decoded.email }).lean();
        if (!owner) return res.status(404).send('Owner not found');
        owner.profileUrl = null;
        if (owner.profilePicture) {
            const p = owner.profilePicture.toString();
            if (p.startsWith('http') || p.startsWith('/')) owner.profileUrl = p;
            else owner.profileUrl = `/images/${p}`;
        }
        owner.proofUrl = null;
        if (owner.proofOfOwnership) {
            const p = owner.proofOfOwnership.toString();
            if (p.startsWith('http') || p.startsWith('/')) owner.proofUrl = p;
            else owner.proofUrl = `/images/${p}`;
        }
        return res.render('editOwner', { owner });
    } catch (err) {
        console.error('Error rendering owner edit page:', err);
        return res.status(500).send('Server error');
    }
}

async function handleOwnerEditSubmit(req, res) {
    const token = req.cookies?.uuid || req.cookies?.ownertoken;
    const decoded = getUser(token);
    if (!decoded) return res.redirect('/owners/owner_login');

    try {
        // resolve owner id
        let ownerDoc = null;
        if (decoded.id) ownerDoc = await ownersData.findById(decoded.id);
        if (!ownerDoc && decoded.email) ownerDoc = await ownersData.findOne({ email: decoded.email });
        if (!ownerDoc) return res.status(404).send('Owner not found');

        const { username, email, contactNumber, oldPassword, password } = req.body;
        if (username) ownerDoc.username = username.trim();
        if (email) ownerDoc.email = email;
        if (contactNumber) ownerDoc.contactNumber = contactNumber;

        // handle uploaded files (proofOfOwnership and profilePicture)
        const proofFile = req.files && req.files['proofOfOwnership'] && req.files['proofOfOwnership'][0];
        const profileFile = req.files && req.files['profilePicture'] && req.files['profilePicture'][0];

        if (proofFile) {
            const file64 = proofFile.buffer.toString('base64');
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    imagekit.upload({
                        file: `data:${proofFile.mimetype};base64,${file64}`,
                        fileName: proofFile.originalname
                    }, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    })
                });
                ownerDoc.proofOfOwnership = uploadResult.url || ownerDoc.proofOfOwnership;
            } catch (ikErr) {
                console.error('ImageKit upload failed for proof during edit, falling back to local save:', ikErr);
                try {
                    const imagesDir = path.join(__dirname, '..', 'public', 'images');
                    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
                    const savePath = path.join(imagesDir, proofFile.originalname);
                    fs.writeFileSync(savePath, proofFile.buffer);
                    ownerDoc.proofOfOwnership = proofFile.originalname;
                } catch (fsErr) {
                    console.error('Local save failed for proof during edit:', fsErr);
                }
            }
        }

        if (profileFile) {
            const file64 = profileFile.buffer.toString('base64');
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    imagekit.upload({
                        file: `data:${profileFile.mimetype};base64,${file64}`,
                        fileName: profileFile.originalname
                    }, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    })
                });
                ownerDoc.profilePicture = uploadResult.url || ownerDoc.profilePicture;
            } catch (ikErr) {
                console.error('ImageKit upload failed for profile during edit, falling back to local save:', ikErr);
                try {
                    const imagesDir = path.join(__dirname, '..', 'public', 'images');
                    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
                    const savePath = path.join(imagesDir, profileFile.originalname);
                    fs.writeFileSync(savePath, profileFile.buffer);
                    ownerDoc.profilePicture = profileFile.originalname;
                } catch (fsErr) {
                    console.error('Local save failed for profile during edit:', fsErr);
                }
            }
        }

        // password change: require current password
        if (password) {
            if (!oldPassword) return res.status(400).send('Current password required to change password');
            if (oldPassword !== ownerDoc.password) return res.status(401).send('Current password incorrect');
            ownerDoc.password = password;
        }

        await ownerDoc.save();
        return res.redirect('/owners/profile');
    } catch (err) {
        console.error('Error updating owner profile:', err);
        return res.status(500).send('Server error');
    }
}
module.exports = {
    handleOwnersPage,
    handleOwnersData,
    handleOwnersOrofilePage,
    handleOwnerLogin,
    handleOwnerLoginPage,
    handleOwnerEditPage,
    handleOwnerEditSubmit
}
