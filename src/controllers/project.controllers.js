const exp = require("constants");
const path = require("path");
const customer_db = require('../models/project.customer');
const order_db = require('../models/project.order');
const shop_db = require('../models/project.shop');
const { parse } = require('json2csv');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");

exports.homepage = function (req, res) {
    res.render('index');
}

exports.sendMail = function (req, res) {

    const transporter = nodemailer.createTransport({
        port: 465,               // true for 465, false for other ports
        host: "smtp.gmail.com",
        auth: {
            user: "bagittagit16@gmail.com",
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
        secure: true,
    });

    const mailData = {
        from: 'bagittagit16@gmail.com"',  // sender address
        to: req.body.email,   // list of receivers
        subject: 'Sending Email using Node.js',
        text: 'That was easy!',
        html: `<b>Hey there! </b><br> Greetings from B.I.T.I <br/> We are delighted to see that you want to expore more about our product. feel free to click the button below and sign up for free! <br><br><br><br><br> <a href="https://b-i-t-i.onrender.com/business_signup" style="text-decoration:none;
        width: 200px; padding: 15px; box-shadow: 6px 6px 5px; 
        font-weight: MEDIUM; background: #3ebfac; color: #000000; 
        cursor: pointer; border-radius: 10px; border: 1px solid #D9D9D9; 
        font-size: 110%;">START NOW</a>`,
    };

    transporter.sendMail(mailData, function (err, info) {
        if (err)
            console.error(err)
        res.redirect('/');
    });
}

exports.doubt = function (req, res) {

    const transporter = nodemailer.createTransport({
        port: 465,               // true for 465, false for other ports
        host: "smtp.gmail.com",
        auth: {
            user: "bagittagit16@gmail.com",
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
        secure: true,
    });

    const mailData = {
        from: req.body.email,   // list of receivers
        to: 'bagittagit16@gmail.com"',  // sender address
        subject: req.body.sub,
        text: 'Message from User!',
        html: `From ${req.body.name}!<br>${req.body.msg}`
    };

    transporter.sendMail(mailData, function (err, info) {
        if (err)
            console.error(err)
        res.redirect('/');
    });
}

exports.business_signuppage = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business")
        res.redirect("/business_home");        // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.render("business_signup", { flash: '' });
}

exports.business_home = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        shop_db.findOne({ email: session.email }, async function (err, user) {
            if (err) {
                //handle error here
                console.error(err);
            }

            //if a user was found, that means the user's email matches the session email
            if (user) {
                let business = await shop_db.findOne({ email: session.email }).exec();
                let business_id = business._id;
                let orders = await order_db.find({ shopID: business_id }).exec();
                let total_orders = orders.length;
                let upcoming_orders = [];
                const d = new Date();
                let incoming = 0
                let overdue = 0;
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        let urgent = true;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                        overdue += 1;
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        let urgent = false;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                        incoming += 1;
                    }
                });
                upcoming_orders = upcoming_orders.sort((a, b) => Number(b.urgent) - Number(a.urgent));
                let alerts = [];
                if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) }
                if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) }
                res.render("business_home", { user, upcoming_orders, alerts, total_orders });
            } else {
                //code if no user with session email was found
                res.redirect('/logout');
            };
        })
    }
    // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.redirect('/logout');
}


exports.update_business_profile = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        let updatedProfile = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address
        };
        shop_db.findByIdAndUpdate(req.body.id, updatedProfile, function (err, order) {
            if (err) console.error(err);
            res.redirect("/business_home");
        });
    }
    else
        res.redirect('/logout');
}

exports.business_home_signup = async function (req, res) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    let business = new shop_db({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: hashedPassword,
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
            res.render('business_login', { flash: 'An Account with this Email already exists! Please sign in.' });
            return err;
        } else {
            //code if no user with entered email was found
            business.save(function (err) {
                if (err) {
                    return (err);
                }
                let session = req.session;
                session.email = req.body.email;
                session.type = "business";
                res.redirect('/business_home')
            })
        }
    });
}

exports.business_home_login = function (req, res) {
    shop_db.findOne({ email: req.body.email }, async function (err, user) {
        if (err) {
            console.error(err);
        }
        if (user) {
            const result = await bcrypt.compare(req.body.password, user.password);
            if (result) {
                let session = req.session;
                session.email = req.body.email;
                session.type = "business";
                res.redirect('/business_home')
            }
            else {
                var err = new Error('Incorrect Password.')
                err.status = 400;
                res.render('business_login', { flash: 'Incorrect Password Entered. Please try again.' });
                return err;
            }
        } else {
            //code if no user with entered email was found
            var err = new Error('Invalid email ID. Please signup.')
            err.status = 400;
            res.render('business_signup', { flash: 'Incorrect Email ID Entered. Please Sign up.' });
            return err;
        }
    });
}

exports.business_loginpage = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business")
        res.redirect("/business_home");    // res.send({ email: session.email }); // Fix me
    else
        res.render("business_login", { flash: '' });
}

exports.business_orders = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        shop_db.findOne({ email: session.email }, async function (err, user) {
            if (err) {
                //handle error here
                console.error(err);
            }

            //if a user was found, that means the user's email matches the session email
            if (user) {
                let business_id = await shop_db.findOne({ email: session.email }).exec();
                let orders = await order_db.find({ shopID: business_id }).sort({ dateOfOrder: -1 }).exec();
                let total_orders = orders.length;
                const d = new Date();
                let incoming = 0
                let overdue = 0;
                let alerts = []
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        overdue += 1;
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        incoming += 1;
                    }
                });
                if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) }
                if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) }
                res.render("business_orders", { user, orders, flash: '', alerts, total_orders });
            } else {
                //code if no user with session email was found
                res.redirect('/logout');
            };
        })
    }
    // res.send({ email: session.email }); // fix me. redirect to protected business home page
    else
        res.render('business_signup', { flash: '' });
}

exports.create_order = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {

        let business_id = await shop_db.findOne({ email: session.email }).exec();
        let customer_id = await customer_db.findOne({ phone: req.body.phone }).exec();
        if (customer_id === null) {
            let order = new order_db({
                orderDesc: req.body.desc,
                dueDate: req.body.duedate,
                orderType: req.body.ordertype,
                paymentMethod: req.body.paymentMethod,
                payableAmount: req.body.paymentAmount,
                status: "Confirmed",
                updates: "",
                customerPhone: req.body.phone,
                additionalNotes: req.body.notes,
                shopID: business_id.shopID,
                profileID: null
            });
            order.save(function (err) {
                if (err) {
                    return (err);
                }
            });
            res.redirect('/business_orders');
        }
        else {
            let order = new order_db({
                orderDesc: req.body.desc,
                dueDate: req.body.duedate,
                orderType: req.body.ordertype,
                paymentMethod: req.body.paymentMethod,
                payableAmount: req.body.paymentAmount,
                status: "Confirmed",
                updates: "",
                customerPhone: req.body.phone,
                additionalNotes: req.body.notes,
                shopID: business_id.shopID,
                profileID: customer_id._id
            });
            order.save(function (err) {
                if (err) {
                    return (err);
                }
            });
            res.redirect('/business_orders');
        }
    }
    else
        res.render("business_login", { flash: '' });
}

exports.order_update_page = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        let user = await shop_db.findOne({ email: session.email }).exec();
        let order = await order_db.findOne({ _id: req.body.id }).exec();
        res.render('order_update', { user, order });
    }
    else {
        res.redirect('/logout');
    }
}

exports.order_update = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        const dateObj = new Date();
        let updatedOrder = {
            orderDesc: req.body.desc,
            dueDate: req.body.duedate,
            orderType: req.body.ordertype,
            paymentMethod: req.body.paymentMethod,
            payableAmount: req.body.payableAmount,
            status: req.body.status,
            updates: req.body.updates,
            customerPhone: req.body.phone,
            additionalNotes: req.body.notes,
            updatedOn: dateObj
        };
        if (req.body.status === "Completed") updatedOrder.deliveredDate = new Date();
        else updatedOrder.deliveredDate = null;
        let customer = await customer_db.findOne({ phone: req.body.phone }).exec();
        if (customer != null) {
            updatedOrder.profileID = customer._id;
        }
        order_db.findByIdAndUpdate(req.body.id, updatedOrder, function (err, order) {
            if (err) return next(err);
            res.redirect("/business_orders");
        });
    }
    else
        res.render("business_login", { flash: '' });
};

exports.order_update_page = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        let user = await shop_db.findOne({ email: session.email }).exec();
        let order = await order_db.findById(req.body.id).exec();
        let business = await shop_db.findOne({ email: session.email }).exec();
        let business_id = business._id;
        let orders = await order_db.find({ shopID: business_id }).exec();
        let total_orders = orders.length;
        const d = new Date();
        let incoming = 0
        let overdue = 0;
        let alerts = []
        orders_loop = orders.map((order) => {
            orderDate = new Date(order.dueDate.toISOString());
            if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                overdue += 1;
            }
            else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                incoming += 1;
            }
        });
        if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`); }
        if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`); }
        res.render('order_update', { user, order, alerts, total_orders });
    }
    else
        res.render("business_login", { flash: '' });
};

exports.delete_order = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        order_db.findByIdAndDelete(req.body.id, function (err, docs) {
            if (err) {
                console.error(err)
            }
            else {
                res.redirect("/business_orders");
            }
        });
    }
    else
        res.render("business_login", { flash: '' });
};

exports.view_business = function (req, res) {
    shop_db.findOne({ _id: req.params.id }, function (err, shop) {
        res.render('view_business', { shop });
    });
}

exports.add_review = function (req, res) {
    shop_db.findOne({ _id: req.params.id }, function (err, shop) {
        res.render('business_review', { shop });
    });
}

exports.submit_review = async function (req, res) {
    let d = new Date();
    let business = await shop_db.find({ _id: req.body.id }).exec();
    let curr_reviews = business[0].reviews;
    let curr_rating = business[0].rating;
    let curr_numOfRating = business[0].numOfRating;
    curr_rating = (curr_rating * curr_numOfRating) + parseInt(req.body.rate_value);
    curr_numOfRating += 1;
    curr_rating = Math.round(curr_rating / curr_numOfRating);
    let review = { name: req.body.name, email: req.body.email, body: req.body.msg, date: d };
    curr_reviews.push(review);
    await shop_db.findByIdAndUpdate(req.body.id, { reviews: curr_reviews, numOfRating: curr_numOfRating, rating: curr_rating }).exec();
    let link = "/view-business/" + req.body.id;
    res.redirect(link);
}

exports.generate_csv = async function (req, res) {
    let session = req.session;
    if (session.email && session.type == "business") {
        let orders = await order_db.find({ shopID: req.body.id }).exec();
        let final_orders = [];
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i];
            if (order.profileID != null) {
                let customer = await customer_db.find({ _id: order.profileID }).exec();
                let customerName = customer[0].name;
                let customerEmail = customer[0].email;
                let customerAddress = customer[0].address;
                let updated_order = { ...order._doc, customerName, customerEmail, customerAddress };
                final_orders.push(updated_order);
            }
            else {
                let customerName = "";
                let customerEmail = "";
                let customerAddress = "";
                let updated_order = { ...order._doc, customerName, customerEmail, customerAddress };
                final_orders.push(updated_order);
            }
        };
        const fields = ["orderDesc", "orderID", "dateOfOrder", 'dueDate', 'deliveredDate', 'orderType', 'paymentMethod', 'customerPhone', 'payableAmount', 'status', 'updates', 'updatedOn', 'additionalNotes', 'customerName', 'customerEmail', 'customerAddress'];
        const opts = { fields };
        try {
            const csv = parse(final_orders, opts);
            let d = new Date(Date.now()).toLocaleString();
            d = d.substring(0, 10);
            d = d.replaceAll("/", "-");
            const filename = "my-orders-" + d + ".csv";
            fs.writeFile(filename, csv, function (err) {
                if (err) throw err;
            });
        }
        catch { }
        res.redirect('/business_home')
    }
    else if (session.email && session.type == "customer") {
        let orders = await order_db.find({ profileID: req.body.id }).exec();
        let final_orders = [];
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i];
            if (order.shopID != null) {
                let shop = await shop_db.find({ _id: order.shopID }).exec();
                let shopName = shop[0].name;
                let shopEmail = shop[0].email;
                let shopAddress = shop[0].address;
                let shopPhone = shop[0].phone;
                let updated_order = { ...order._doc, shopName, shopEmail, shopAddress, shopPhone };
                final_orders.push(updated_order);
            }
            else {
                let shopName = "";
                let shopEmail = "";
                let shopPhone = "";
                let shopAddress = "";
                let updated_order = { ...order._doc, shopName, shopEmail, shopAddress, shopPhone };
                final_orders.push(updated_order);
            }
        };
        const fields = ["orderDesc", "orderID", "dateOfOrder", 'dueDate', 'deliveredDate', 'orderType', 'paymentMethod', 'customerPhone', 'payableAmount', 'status', 'updates', 'updatedOn', 'additionalNotes', "shopName", "shopEmail", "shopAddress", "shopPhone"];
        const opts = { fields };
        try {
            const csv = parse(final_orders, opts);
            let d = new Date(Date.now()).toLocaleString();
            d = d.substring(0, 10);
            d = d.replaceAll("/", "-");
            const filename = "my-orders-" + d + ".csv";
            fs.writeFile(filename, csv, function (err) {
                if (err) throw err;
            });
        }
        catch { }
        res.redirect('/customer_home')
    }
    else
        res.redirect('/logout');
}

exports.rate_customer = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "business") {
        let user = await shop_db.findOne({ email: session.email }).exec();
        await order_db.findByIdAndUpdate(req.body.order_id, { "status": "Completed" }).exec();
        let order = await order_db.findOne({ _id: req.body.order_id }).exec();

        if (req.body.customer_id === "") {
            res.render('order_update', { user, order })
        }
        else {
            let customer = await customer_db.findOne({ _id: req.body.customer_id }).exec();
            let curr_rating = (customer.rating * customer.numOfRating) + parseInt(req.body.rating);
            let curr_numOfRating = customer.numOfRating + 1;
            curr_rating = Math.round(curr_rating / curr_numOfRating);
            let updatedCustomer = {
                "rating": curr_rating,
                "numOfRating": curr_numOfRating
            }
            await customer_db.findByIdAndUpdate(req.body.customer_id, updatedCustomer).exec();
            res.render('order_update', { user, order })
        }
    }
    else
        res.redirect('/logout');
}

exports.chart_page = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "customer") {
        let user = await customer_db.findOne({ email: session.email }).exec();
        let orders = await order_db.find({ profileID: user._id }).exec();
        let dashboard_stats = { monthly_expenses: 0, yearly_expenses: 0, pending_orders: 0, total_orders: 0 };
        let bar_chart_stats = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0
        };
        let delivery_stats = {
            "On/Before Time Delivery": 0,
            "Delayed Delivery": 0
        }
        let paymentMethod_stats = {
            "Credit Card": 0,
            "Debit Card": 0,
            "Cash": 0,
            "UPI": 0,
            "Bank Transfer": 0,
            "Online Wallets": 0,
            "Other": 0
        }
        let order_categories = {
            "Books": 0,
            "Car & Automobiles": 0,
            "Clothing & Accessories": 0,
            "Electronics": 0,
            "Grocery & Gourmet": 0,
            "Health & Personal Care": 0,
            "Home & Kitchen": 0,
            "Jewellery": 0,
            "Musical Instruments": 0,
            "Office Product": 0,
            "Shoes & Handbag": 0,
            "Sports & Fitness": 0,
            "Toys & Games": 0,
            "Watches": 0
        }
        const d = new Date();
        let alerts = [];
        let incoming = 0
        let overdue = 0;
        monthly_expenses_func = orders.map((order) => {
            orderDate = new Date(order.dateOfOrder.toISOString());
            orderDueDate = new Date(order.dueDate.toISOString());
            if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                overdue += 1;
            }
            else if (orderDueDate.getMonth() === d.getMonth() && order.status != "Completed") {
                incoming += 1;
            }
            if (order.status != "Cancelled")
                dashboard_stats.total_orders += 1;
            if (orderDate.getMonth() === d.getMonth() && order.status === "Completed")
                dashboard_stats.monthly_expenses += order.payableAmount;
            if (orderDate.getFullYear() === d.getFullYear() && order.status === "Completed")
                dashboard_stats.yearly_expenses += order.payableAmount;
            if (order.status != "Completed" && order.status != "Cancelled")
                dashboard_stats.pending_orders += 1;
            if (order.status === "Completed") {
                order_categories[order.orderType] += 1;
                paymentMethod_stats[order.paymentMethod] += 1;
                if (order.deliveredDate.valueOf() <= order.dueDate.valueOf())
                    delivery_stats["On/Before Time Delivery"] += 1;
                else delivery_stats["Delayed Delivery"] += 1;
                bar_chart_stats[String(orderDate.getMonth())] += order.payableAmount;
            }
        });
        if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) };
        if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) };
        res.render('charts', { user, order_categories, bar_chart_stats, delivery_stats, paymentMethod_stats, dashboard_stats, role: "customer", alerts });

    } else if (session.email && session.type === "business") {
        let user = await shop_db.findOne({ email: session.email }).exec();
        let business = user;
        let business_id = business._id;
        let orders = await order_db.find({ shopID: business_id }).exec();
        let dashboard_stats = { monthly_earnings: 0, yearly_earnings: 0, pending_orders: 0, total_orders: 0 };
        let bar_chart_stats = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0
        };
        let delivery_stats = {
            "On/Before Time Delivery": 0,
            "Delayed Delivery": 0
        }
        let paymentMethod_stats = {
            "Credit Card": 0,
            "Debit Card": 0,
            "Cash": 0,
            "UPI": 0,
            "Bank Transfer": 0,
            "Online Wallets": 0,
            "Other": 0
        }
        let order_categories = {
            "Books": 0,
            "Car & Automobiles": 0,
            "Clothing & Accessories": 0,
            "Electronics": 0,
            "Grocery & Gourmet": 0,
            "Health & Personal Care": 0,
            "Home & Kitchen": 0,
            "Jewellery": 0,
            "Musical Instruments": 0,
            "Office Product": 0,
            "Shoes & Handbag": 0,
            "Sports & Fitness": 0,
            "Toys & Games": 0,
            "Watches": 0
        }
        let incoming = 0;
        let overdue = 0;
        let alerts = [];
        const d = new Date();
        monthly_earnings_func = orders.map((order) => {
            orderDate = new Date(order.dateOfOrder.toISOString());
            orderDueDate = new Date(order.dueDate.toISOString());
            if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                overdue += 1;
            }
            else if (orderDueDate.getMonth() === d.getMonth() && order.status != "Completed") {
                incoming += 1;
            }
            if (order.status != "Cancelled")
                dashboard_stats.total_orders += 1;
            if (orderDate.getMonth() === d.getMonth() && order.status === "Completed")
                dashboard_stats.monthly_earnings += order.payableAmount;
            if (orderDate.getFullYear() === d.getFullYear() && order.status === "Completed")
                dashboard_stats.yearly_earnings += order.payableAmount;
            if (order.status != "Completed" && order.status != "Cancelled")
                dashboard_stats.pending_orders += 1;
            if (order.status === "Completed") {
                order_categories[order.orderType] += 1;
                paymentMethod_stats[order.paymentMethod] += 1;
                if (order.deliveredDate.valueOf() <= order.dueDate.valueOf())
                    delivery_stats["On/Before Time Delivery"] += 1;
                else delivery_stats["Delayed Delivery"] += 1;
                bar_chart_stats[String(orderDate.getMonth())] += order.payableAmount;
            }
        });
        if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) }
        if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) }
        res.render('charts', { user, order_categories, bar_chart_stats, delivery_stats, paymentMethod_stats, dashboard_stats, role: "business", alerts });
    }
    else
        res.redirect('/logout')
}

exports.customer_signuppage = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "customer")
        res.redirect("/customer_home");
    else
        res.render("customer_signup", { flash: '' });
}

exports.customer_home_signup = async function (req, res) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    let customer = new customer_db({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: hashedPassword,
    });

    customer_db.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            console.error(err);
        }
        if (user) {
            var err = new Error('A customers with this email has already registered. Please login.')
            err.status = 400;
            res.render('customer_login', { flash: 'An Account with this Email already exists! Please sign in.' });
            return err;
        } else {
            //code if no user with entered email was found
            customer.save(function (err) {
                if (err) {
                    return (err);
                }
                let session = req.session;
                session.email = req.body.email;
                session.type = "customer";
                res.redirect('/customer_home')
            })
        }
    });
}


exports.customer_loginpage = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "customer")
        res.redirect("/customer_home");
    else
        res.render("customer_login", { flash: '' });
}

exports.customer_home_login = function (req, res) {
    customer_db.findOne({ email: req.body.email }, async function (err, user) {
        if (err) {
            console.error(err);
        }
        if (user) {
            const result = await bcrypt.compare(req.body.password, user.password);
            if (result) {
                let session = req.session;
                session.email = req.body.email;
                session.type = "customer";
                res.redirect('/customer_home')
            }
            else {
                var err = new Error('Incorrect Password.')
                err.status = 400;
                res.render('customer_login', { flash: 'Incorrect Password Entered. Please try again.' });
                return err;
            }
        } else {
            var err = new Error('Invalid email ID. Please signup.')
            err.status = 400;
            res.render('customer_signup', { flash: 'Incorrect Email ID Entered. Please Sign up.' });
            return err;
        }
    });
}

exports.customer_home = function (req, res) {
    let session = req.session;
    if (session.email && session.type === 'customer') {
        customer_db.findOne({ email: session.email }, async function (err, user) {
            if (err) {
                console.error(err);
            }
            if (user) {
                let user_id = user._id;
                let orders = await order_db.find({ profileID: user_id }).exec();
                let upcoming_orders = [];
                let alerts = [];
                let total_orders = orders.length;
                const d = new Date();
                let incoming = 0
                let overdue = 0;
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        let urgent = true;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                        overdue += 1;
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        let urgent = false;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                        incoming += 1;
                    }
                });
                upcoming_orders = upcoming_orders.sort((a, b) => Number(b.urgent) - Number(a.urgent));
                if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) }
                if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) }
                res.render('customer_home', { user, upcoming_orders, total_orders, alerts });
            } else {
                res.redirect('/logout');
            };
        })
    }
    else {
        res.redirect('/customer_login')
    }
}

exports.update_customer_profile = function (req, res) {
    let session = req.session;
    if (session.email && session.type === "customer") {
        let updatedProfile = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address
        };
        customer_db.findByIdAndUpdate(req.body.id, updatedProfile, function (err, order) {
            if (err) console.error(err);
            res.redirect("/customer_home");
        });
    }
    else
        res.redirect('/logout');
}

exports.customer_orders = async function (req, res) {
    let session = req.session;
    if (session.email && session.type === "customer") {
        customer_db.findOne({ email: session.email }, async function (err, user) {
            if (err) {
                console.error(err);
            }
            if (user) {
                let customer_id = await customer_db.findOne({ email: session.email }).exec();
                let orders = await order_db.find({ profileID: customer_id }).sort({ dateOfOrder: -1 }).exec();
                let total_orders = orders.length;
                let alerts = [];
                let incoming = 0
                let overdue = 0;
                const d = new Date();
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        overdue += 1;
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        incoming += 1;
                    }
                });
                if (incoming > 0) { alerts.push(`You have ${incoming} upcoming orders!`) }
                if (overdue > 0) { alerts.push(`You have ${overdue} orders overdue!`) }
                res.render("customer_orders", { user, orders, total_orders, alerts });
            } else {
                res.redirect('/logout');
            };
        })
    }
    else
        res.redirect('/customer_login');
}

exports.view_status = function (req, res) {
    order_db.findOne({ _id: req.params.id }, async function (err, order) {
        let business = await shop_db.findOne({ _id: order.shopID }).exec();
        res.render('view_status', { order, business });
    });
}

exports.logout = function (req, res) {
    req.session.destroy();
    res.redirect('/');
}