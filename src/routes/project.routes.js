const path = require("path");
const express = require('express');
const router = express.Router();
const passport = require('passport');

const project_controller = require('../controllers/project.controllers');

router.get("/", project_controller.homepage);

router.get("/business_signup", project_controller.business_signuppage);
router.post("/business_home_signup", project_controller.business_home_signup);
router.post("/business_home_login", project_controller.business_home_login);
router.get("/business_home", project_controller.business_home);


router.get('/google', passport.authenticate('google', {
    scope: ['email', 'profile']
}));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: "/",
}), function (req, response) {
    req.session.userData = {
        profile: req.user.photos[0].value,
        email: req.user.email
    };
    req.session.loggedin = true;;

    response.redirect("/business_home");
    response.end();
});


router.get("/business_login", project_controller.business_loginpage);
router.get("/customer_signup", project_controller.customer_signuppage);
router.get("/customer_login", project_controller.customer_loginpage);

router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.status(400).send('Unable to log out')
            } else {
                res.send('Logout successful')
            }
        });
    } else {
        res.end()
    }
})

module.exports = router;