var express = require('express');
var router = express.Router();
var dbHandler = require("../public/javascripts/mappingDB");

router.post("/", function(req, res) {
    dbHandler.query("SELECT client_id FROM users", function (err, result, fields) {
        if (err) throw err;

        for (let user of result) {
            let userid = user["client_id"];
            let timeTo = new Date();
            let timeFrom = timeTo - 10000;

            let i = 0;
            dbHandler.query("SELECT latitude, longitude, update_time FROM " + userid + " ORDER BY update_time DESC LIMIT 1",
                function (err, result, fields) {
                    if (err) throw err;
                    if (result.length > 0) {
                        if (result[0]["update_time"] > timeFrom) {
                            global.currentLocations.push({userid: result});
                        }
                    }
                });
            i++;
        }
        console.log(JSON.stringify(global.currentLocations));

        res.send(global.currentLocations);
        global.currentLocations = [];
    });
});

module.exports = router;