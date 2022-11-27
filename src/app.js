const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path");
require('dotenv').config()

MONGO_PASSWORD = process.env.MONGO_PASSWORD

mongoose.connect(`mongodb+srv://VIT_Admin:${MONGO_PASSWORD}@vitdiaries.tpuku.mongodb.net/NodeJS-CRUD?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function() {
    console.log("Connected successfully!");
});

const project = require('./routes/project.routes');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/projects', project);

module.exports = app;