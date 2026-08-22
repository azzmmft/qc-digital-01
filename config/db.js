const mysql = require("mysql2/promise");


// ========================================
// MYSQL CONNECTION POOL
// ========================================

const pool = mysql.createPool({

    host: "localhost",

    port: 3307,

    user: "root",

    password: "123456",

    database: "qc_digital",

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
        console.log("Host     : localhost");
        console.log("Port     : 3307");
        console.log("Database : qc_digital");
        console.log("User     : root");
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