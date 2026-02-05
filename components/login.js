const users = require("../models/register")
const { setUser } = require("../config/auth");
async function loginHandler(req, res) {

    let { email, password } = req.body



    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
    try {
        try {

            const userdata = await users.findOne({ email, password });
            if (!userdata) return res.status(401).send('Invalid credentials');

            const jwtToken = setUser(userdata);
            // set cookie with httpOnly and 7 day expiry
            res.cookie('uuid', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

            const redirectTo = req.body.next || '/profile';
            return res.redirect(redirectTo);
        } catch (error) {
            console.log('Login error:', error);
            return res.status(500).send('Something went wrong, please try again later');
        }



    }
    catch (error) {
        console.error("Unexpected error during login:", error)
        return res.status(500).send("Unexpected server error")
    }

}


function loginPage(req, res) {
    res.render("login", { next: req.query.next || '' })
}

module.exports =
{
    loginHandler,
    loginPage
}
