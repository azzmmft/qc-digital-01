const mysql = require("mysql2/promise");


// ========================================
// MYSQL CONNECTION POOL
// ========================================

const pool = mysql.createPool({

    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

});


// ========================================
// TEST CONNECTION
// ========================================

async function testConnection() {

    try {

        const connection =
            await pool.getConnection();

        console.log("");
        console.log("================================");
        console.log("MYSQL CONNECTED");
        console.log("================================");
        console.log("Host     :", process.env.DB_HOST);
        console.log("Port     :", process.env.DB_PORT);
        console.log("Database :", process.env.DB_NAME);
        console.log("User     :", process.env.DB_USER);
        console.log("================================");
        console.log("");

        connection.release();

    } catch (error) {

        console.error("");
        console.error("================================");
        console.error("MYSQL CONNECTION FAILED");
        console.error("================================");
        console.error(error.message);
        console.error("");

        throw error;

    }

}


module.exports = {
    pool,
    testConnection
};