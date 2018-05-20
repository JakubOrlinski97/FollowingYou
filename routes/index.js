var express = require('express');
var router = express.Router();
var dbHandler = require("../public/javascripts/db");


/* GET home page. */
router.get('/', function(req, res, next) {

    dbHandler.query("SELECT * FROM Projects", function (err, result, fields) {
        if (err) throw err;
        console.log(JSON.stringify(result));
        res.render('index', {title: "JakeTheSnake", projects: result});
    });
});

module.exports = router;
