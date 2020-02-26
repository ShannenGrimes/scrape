// Dependencies
var express = require("express");
var router = express.Router();

// Require all models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js")

// Load index page
router.get("/", function (req, res) {
    res.redirect("index");
});


module.exports = router;