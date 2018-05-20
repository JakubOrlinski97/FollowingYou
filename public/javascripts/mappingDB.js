var mysql = require('mysql');
var connection = mysql.createConnection({
    host: "localhost",
    user: "FollowingYou",
    password: "rJH@&I##tpRUoHbpSQG7ui64*d",
    database: "MappingInJava"
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;