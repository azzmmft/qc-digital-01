const {
    pool,
    testConnection
} = require("./config/db");


async function main() {

    try {

        // Test koneksi
        await testConnection();


        // Test query
        const [rows] =
            await pool.query(
                "SELECT DATABASE() AS database_name"
            );


        console.log(
            "Database aktif:",
            rows[0].database_name
        );


        // Tutup pool
        await pool.end();


    } catch (error) {

        console.error(
            "Database test gagal:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


main();