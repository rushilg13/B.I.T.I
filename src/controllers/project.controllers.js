const path = require("path");
const customer_db = require('../models/project.customer');
const order_db = require('../models/project.order');
const shop_db = require('../models/project.shop');

exports.homepage = function (req, res) {
    res.render('index');
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
                let upcoming_orders = [];
                const d = new Date();
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        let urgent = true;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        let urgent = false;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                    }
                });
                upcoming_orders = upcoming_orders.sort((a, b) => Number(b.urgent) - Number(a.urgent));
                res.render("business_home", { user, upcoming_orders });
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
    shop_db.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            console.error(err);
        }
        if (user) {
            if (user.password === req.body.password) {
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
                res.render("business_orders", { user, orders, flash: '' });
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
        res.render('order_update', { user, order })
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
        res.render('order_update', { user, order });
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
        monthly_expenses_func = orders.map((order) => {
            orderDate = new Date(order.dateOfOrder.toISOString());
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
        res.render('charts', { user, order_categories, bar_chart_stats, delivery_stats, paymentMethod_stats, dashboard_stats, role: "customer" });

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
        const d = new Date();
        monthly_earnings_func = orders.map((order) => {
            orderDate = new Date(order.dateOfOrder.toISOString());
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
        res.render('charts', { user, order_categories, bar_chart_stats, delivery_stats, paymentMethod_stats, dashboard_stats, role: "business" });
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

exports.customer_home_signup = function (req, res) {
    let customer = new customer_db({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: req.body.password,
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
    customer_db.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            console.error(err);
        }
        if (user) {
            if (user.password === req.body.password) {
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
                const d = new Date();
                orders_loop = orders.map((order) => {
                    orderDate = new Date(order.dueDate.toISOString());
                    if (order.dueDate.toISOString() <= d.toISOString() && order.status != "Completed") {
                        let urgent = true;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                    }
                    else if (orderDate.getMonth() === d.getMonth() && order.status != "Completed") {
                        let urgent = false;
                        order = { ...order._doc, urgent };
                        upcoming_orders.push(order);
                    }
                });
                upcoming_orders = upcoming_orders.sort((a, b) => Number(b.urgent) - Number(a.urgent));
                res.render('customer_home', { user, upcoming_orders });
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
                res.render("customer_orders", { user, orders });
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