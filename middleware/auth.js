const { getUser} = require("../config/auth");

async function restricToLoggedInUserOnly(req,res,next) {
    const token = req.cookies?.uuid;
    if (!token) {
        return res.redirect("/login");
    }
    const user = getUser(token)
    if(!user)
    {
        return res.redirect("/login")
    }
    req.user = user;

    next();
}


function requireRole(role) {
    return (req, res, next) => {
        const token = req.cookies?.uuid;
        const loginRoute = role === 'owner' ? '/owners/owner_login' : '/login';
        if (!token) return res.redirect(loginRoute);
        const decoded = getUser(token);
        if (!decoded) return res.redirect(loginRoute);
        const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
        if (!roles.includes(role)) return res.status(403).redirect("/owners/owner_registration");
        req.user = decoded;
        req.user.roles = roles;
        return next();
    }
}

function requireAnyRole(roles) {
    return (req, res, next) => {
        const token = req.cookies?.uuid;
        if (!token) return res.redirect('/login');
        const decoded = getUser(token);
        if (!decoded) return res.redirect('/login');
        const currentRoles = decoded.roles || (decoded.role ? [decoded.role] : []);
        const allowed = currentRoles.some(r => roles.includes(r));
        if (!allowed) return res.status(403).send('You do not have permission to access this resource');
        req.user = decoded;
        req.user.roles = currentRoles;
        return next();
    }
}


module.exports = 
{
    restricToLoggedInUserOnly,
    requireRole,
    requireAnyRole
}