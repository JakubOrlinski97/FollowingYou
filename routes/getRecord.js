var express = require('express');
var router = express.Router();
var dbHandler = require("../public/javascripts/mappingDB");

router.post("/", function(req, res) {
    console.log(req.body);
    let timeFrom = req.body.timeFrom;
    let timeTo = req.body.timeTo;
    let id = req.body.id;

    dbHandler.query("SELECT latitude, longitude, update_time FROM " + id + " WHERE update_time BETWEEN " + timeFrom + " AND " + timeTo + " ORDERED BY update_time;",
        function (err, result, fields) {
            if (err) throw err;
            console.log("Result: " + result);
            res.json( result );
        });
});

module.exports = router;