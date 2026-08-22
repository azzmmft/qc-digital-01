const bcrypt = require("bcrypt");
const { pool } = require("./config/db");

async function hashPassword() {

    try {

        const username = "admin";
        const plainPassword = "admin123";

        const hashedPassword =
            await bcrypt.hash(
                plainPassword,
                10
            );

        console.log("Password hash:");
        console.log(hashedPassword);


        await pool.query(
            `
            UPDATE users
            SET password = ?
            WHERE username = ?
            `,
            [
                hashedPassword,
                username
            ]
        );


        console.log("");
        console.log("================================");
        console.log("PASSWORD BERHASIL DI-HASH");
        console.log("================================");
        console.log("Username:", username);


    }

    catch (error) {

        console.error(
            "Gagal hash password:"
        );

        console.error(error);

    }

    finally {

        await pool.end();

    }

}


hashPassword();