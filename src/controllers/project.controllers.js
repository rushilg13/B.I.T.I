const path = require("path");
const customer_db = require('../models/project.customer');
const order_db = require('../models/project.order');
const shop_db = require('../models/project.shop');

exports.homepage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "index.html"));
}

exports.business_signuppage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "business_signup.html"));
}

exports.business_home = function (req, res) {
    let session = req.session;
    if (session.email)
        res.send({ email: session.email });
    else
        res.send("not logged in");
}

exports.business_home_signup = function (req, res) {
    let business = new shop_db({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: req.body.password,
        categories: req.body.categories // fix me
    });

    shop_db.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            //handle error here
            console.error(err);
        }

        //if a user was found, that means the user's email matches the entered email
        if (user) {
            var err = new Error('A business with this email has already registered. Please login.')
            err.status = 400;
            res.redirect('/business_login');
            return err;
        } else {
            //code if no user with entered email was found
            business.save(function (err) {
                if (err) {
                    return (err);
                }
                let session = req.session;
                session.email = req.body.email;
                res.redirect('/business_home')
            })
        }
    });
}

exports.business_home_login = function (req, res) {
    shop_db.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            //handle error here
            console.error(err);
        }

        //if a user was found, that means the user's email matches the entered email
        if (user) {
            if (user.password === req.body.password) {
                let session = req.session;
                session.email = req.body.email;
                console.log(req.session);
                res.redirect('/business_home')
            }
            else {
                var err = new Error('Incorrect Password.')
                err.status = 400;
                res.redirect('/business_login');
                return err;
            }
        } else {
            //code if no user with entered email was found
            var err = new Error('Invalid email ID. Please signup.')
            err.status = 400;
            res.redirect('/business_signup');
            return err;
        }
    });
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

exports.logout = function (req, res) {
    req.session.destroy();
    res.redirect('/');
}