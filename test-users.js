const bcrypt = require("bcrypt");
const { pool } = require("./config/db");

async function createUser() {

    const username = "pengisi";
    const password = "pengisi123";
    const name = "Operator QC";
    const role = "pengisi";

    const hashedPassword =
        await bcrypt.hash(password, 10);

    await pool.query(
        `
        INSERT INTO users
        (
            username,
            password,
            name,
            role
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            username,
            hashedPassword,
            name,
            role
        ]
    );

    console.log("User pengisi berhasil dibuat.");

    await pool.end();

}

createUser()
    .catch(error => {

        console.error(
            "Gagal membuat user:",
            error
        );

        process.exit(1);

    });