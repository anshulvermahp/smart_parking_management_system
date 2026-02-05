const jwt = require("jsonwebtoken");

function setUser(user) {
    if (!user) return null;
    const roles = [];
    // everyone is at least a 'user'
    roles.push('user');
    if (user.owner === true || !!user.proofOfOwnership) roles.push('owner');
    return jwt.sign(
        {
            id: user._id || user.id,
            email: user.email,
            roles,
        },
        process.env.JWT_SECRET_KEY
    );
}

function getUser(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        return null;
    }
}

module.exports = {
    setUser,
    getUser,
};