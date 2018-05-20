var express = require('express');
var router = express.Router();
var dbHandler = require("./gameDB");

router.post('/', function(req, res) {

    dbHandler.query("REPLACE INTO currentStatus " +
        "SET ?;", req.body, function (err, result, fields) {
        if (err) {
            console.log("It was the replace!" + JSON.stringify(req.body));
            throw err;
        }
    });

    dbHandler.query("SELECT * FROM currentStatus WHERE NOT user_id = " + req.body.user_id + " AND updateTime > DATE_SUB(NOW(), INTERVAL 5 SECOND);", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

module.exports = router;