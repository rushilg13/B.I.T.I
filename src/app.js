const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path");
const passport = require('passport');
const session = require('express-session');
require('dotenv').config()
require('../passport');

MONGO_PASSWORD = process.env.MONGO_PASSWORD;
DATABASE_NAME = process.env.DATABASE_NAME;

// mongoose.connect(`mongodb+srv://VIT_Admin:${MONGO_PASSWORD}@vitdiaries.tpuku.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

mongoose.connect('mongodb://localhost:27017/biti', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected successfully!");
});

const project = require('./routes/project.routes');
const app = express();

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: oneDay }
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', project);
app.use(express.static(path.join(__dirname, 'public')))

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

module.exports = app;