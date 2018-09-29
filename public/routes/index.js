var express = require("express");
var router = express.Router();
var User = require("../models/user");


router.get("/", function (req, res) {
    res.render("../views/dashboard")
});

module.exports = router;