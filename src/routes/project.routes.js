const express = require('express');
const router = express.Router();

const project_controller = require('../controllers/project.controllers');

router.get("/", (req, res) => {
    console.log("B");
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

module.exports = router;