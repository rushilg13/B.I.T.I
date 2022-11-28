const path = require("path");
const Project = require('../models/project.models');

exports.homepage = function (req, res) {
    res.sendFile(path.join(__dirname, "../views", "index.html"));
}