const path = require("path");
const express = require('express');
const router = express.Router();

const project_controller = require('../controllers/project.controllers');

router.get("/", project_controller.homepage);

module.exports = router;