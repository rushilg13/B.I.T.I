const path = require("path");
const express = require('express');
const router = express.Router();
const passport = require('passport');

const project_controller = require('../controllers/project.controllers');

router.get("/", project_controller.homepage);

router.get("/business_signup", project_controller.business_signuppage);
router.post("/business_home_signup", project_controller.business_home_signup);
router.get("/business_login", project_controller.business_loginpage);
router.post("/business_home_login", project_controller.business_home_login);
router.get("/business_home", project_controller.business_home);
router.get("/myorders", project_controller.myorders);
router.post("/create_order", project_controller.create_order);
router.post('/update_order', project_controller.order_update_page); // from myorders page passes id of order
// router.get('/update_order', project_controller.order_update);
router.post('/updateOrder', project_controller.order_update); // from update order page passes updated order


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


router.get("/customer_signup", project_controller.customer_signuppage);
router.get("/customer_login", project_controller.customer_loginpage);

router.get('/logout', project_controller.logout);

module.exports = router;