const path = require("path");
const customer_db = require('../models/project.customer');
const order_db = require('../models/project.order');
const shop_db = require('../models/project.shop');

exports.homepage = function (req, res) {
    res.render('index');
}

exports.business_signuppage = function (req, res) {
    let session = req.session;
    if (session.email)
        res.redirect("/business_home");        // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.render("business_signup");
}

exports.business_home = function (req, res) {
    let session = req.session;
    if (session.email) {
        shop_db.findOne({ email: session.email }, function (err, user) {
            if (err) {
                //handle error here
                console.error(err);
            }

            //if a user was found, that means the user's email matches the session email
            if (user) {
                res.render("business_home", { user });
            } else {
                //code if no user with session email was found
                res.redirect('/logout');
            };
        })
    }
    // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.redirect('/business_signup');
}

exports.business_home_signup = function (req, res) {
    let business = new shop_db({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: req.body.password,
        categories: req.body.categories
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
    let session = req.session;
    if (session.email)
        res.redirect("/business_home");    // res.send({ email: session.email }); // Fix me
    else
        res.render("business_login");
}

exports.myorders = async function (req, res) {
    let session = req.session;
    if (session.email) {
        shop_db.findOne({ email: session.email }, async function (err, user) {
            if (err) {
                //handle error here
                console.error(err);
            }

            //if a user was found, that means the user's email matches the session email
            if (user) {
                let business_id = await shop_db.findOne({ email: session.email }).exec();
                let orders = await order_db.find({ shopID: business_id }).exec();
                res.render("myorders", { user, orders });
            } else {
                //code if no user with session email was found
                res.redirect('/logout');
            };
        })
    }
    // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.redirect('/business_signup');
}

exports.create_order = async function (req, res) {
    let session = req.session;
    if (session.email) {

        let business_id = await shop_db.findOne({ email: session.email }).exec();
        let customer_id = await customer_db.findOne({ phone: req.body.phone }).exec();

        let order = new order_db({
            orderDesc: req.body.desc,
            dueDate: req.body.duedate,
            orderType: req.body.ordertype,
            paymentMethod: req.body.paymentMethod,
            payableAmount: req.body.paymentAmount,
            status: "Confirmed",
            updates: "",
            additionalNotes: req.body.notes,
            shopID: business_id,
            profileID: customer_id
        });
        order.save(function (err) {
            if (err) {
                return (err);
            }
        });
        res.redirect('/myorders');
    }
    else
        res.render("business_login");
}

exports.customer_signuppage = function (req, res) {
    res.render("customer_signup");
}

exports.customer_loginpage = function (req, res) {
    res.render("customer_login");
}

exports.logout = function (req, res) {
    req.session.destroy();
    res.redirect('/');
}