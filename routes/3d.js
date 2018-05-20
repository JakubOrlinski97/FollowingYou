var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('3d', {title: "3D funsies"});
});

module.exports = router;
