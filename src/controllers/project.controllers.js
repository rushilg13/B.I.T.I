const path = require("path");
const Project = require('../models/project.models');

exports.homepage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "index.html"));
}

exports.business_signuppage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "business_signup.html"));
}

exports.business_home = function(req, res) {
    res.send(req.body);
}

exports.business_loginpage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "business_login.html"));
}

exports.customer_signuppage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "customer_signup.html"));
}

exports.customer_loginpage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "customer_login.html"));
}