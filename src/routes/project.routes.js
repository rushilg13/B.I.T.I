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
router.post("/update_business_profile", project_controller.update_business_profile);
router.get("/business_orders", project_controller.business_orders);
router.post("/create_order", project_controller.create_order);
router.post('/delete_order', project_controller.delete_order);
router.post('/update_order', project_controller.order_update_page); // from business_orders page passes id of order
router.post('/updateOrder', project_controller.order_update); // from update order page passes updated order
router.get('/view-business/:id', project_controller.view_business);
router.get('/add-review/:id', project_controller.add_review);
router.post('/submit-review', project_controller.submit_review);
router.post('/generate-csv', project_controller.generate_csv);

router.get('/charts', project_controller.chart_page);

router.get("/customer_signup", project_controller.customer_signuppage);
router.post("/customer_home_signup", project_controller.customer_home_signup);
router.get("/customer_login", project_controller.customer_loginpage);
router.post("/customer_home_login", project_controller.customer_home_login);
router.get("/customer_home", project_controller.customer_home);
router.post("/update_customer_profile", project_controller.update_customer_profile);
router.get("/customer_orders", project_controller.customer_orders);
router.get('/logout', project_controller.logout);

router.get('/view-order-status/:id', project_controller.view_status);

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

module.exports = router;