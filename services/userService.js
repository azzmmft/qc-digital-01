const { pool } = require("../config/db");


// ========================================
// CARI USER BERDASARKAN USERNAME
// ========================================

async function findUserByUsername(username) {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            username,
            password,
            name,
            role
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
        [username]
    );

    return rows[0] || null;
}


// ========================================
// CARI USER BERDASARKAN ID
// ========================================

async function findUserById(id) {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            username,
            name,
            role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
}


// ========================================
// EXPORT
// ========================================

module.exports = {

    findUserByUsername,

    findUserById

};