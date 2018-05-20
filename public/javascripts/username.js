var express = require('express');
var router = express.Router();
var dbHandler = require("./gameDB");

router.post('/', function(req, res) {

    dbHandler.query("INSERT INTO users(username) VALUES(?);", req.body.username, function (err, result, fields) {
        if (err) throw err;
        dbHandler.query("SELECT LAST_INSERT_ID() AS user_id;", function (err, result, fields) {
            if (err) throw err;
            res.send(result);
        });
    });
});

module.exports = router;