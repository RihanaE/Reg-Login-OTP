const Pool = require("pg").Pool

const pool = new Pool({
    user: "postgres",
    password: "harun", 
    host: "localhost",
    port: 5432,
    database: "records"
});


module.exports = pool;