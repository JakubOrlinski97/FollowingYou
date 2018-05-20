var mysql = require('mysql');
var connection = mysql.createConnection({
    host: "localhost",
    user: "Jake",
    password: "hQ&xZ6ao@6tr6Mi5U*UQBfv#lt",
    database: "Projects"
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;