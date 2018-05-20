var mysql = require('mysql');
var connection = mysql.createConnection({
    host: "localhost",
    user: "3DJake",
    password: "**&4Wql@T9nMKg2KOIySRjj1cw",
    database: "game"
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;