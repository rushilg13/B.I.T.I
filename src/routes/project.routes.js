const path = require("path");
const express = require('express');
const router = express.Router();

const project_controller = require('../controllers/project.controllers');

router.get("/", project_controller.homepage);

router.get("/business_signup", project_controller.business_signuppage);
router.post("/business_home", project_controller.business_home);


router.get("/business_login", project_controller.business_loginpage);
router.get("/customer_signup", project_controller.customer_signuppage);
router.get("/customer_login", project_controller.customer_loginpage);

module.exports = router;