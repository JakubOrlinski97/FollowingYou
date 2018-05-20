var express = require('express');
var router = express.Router();
var dbHandler = require("../public/javascripts/mappingDB");

/* GET home page. */
router.get('/', function(req, res, next) {

    dbHandler.query("SELECT client_id FROM users", function (err, result, fields) {
        if (err) throw err;
        res.render('followingyou', {title: "Following You", user: result});
    });
});

module.exports = router;
