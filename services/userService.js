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
// AMBIL SEMUA USER
// ========================================

async function findAllUsers() {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            username,
            name,
            role,
            created_at
        FROM users
        ORDER BY id ASC
        `
    );

    return rows;

}

// ========================================
// BUAT USER BARU
// ========================================

async function createUser(
    username,
    password,
    name,
    role
) {

    const [result] = await pool.query(
        `
        INSERT INTO users
            (
                username,
                password,
                name,
                role
            )
        VALUES
            (?, ?, ?, ?)
        `,
        [
            username,
            password,
            name,
            role
        ]
    );

    return result.insertId;
}


// ========================================
// UPDATE USER
// ========================================

async function updateUser(
    id,
    username,
    name,
    role
) {

    const [result] = await pool.query(
        `
        UPDATE users
        SET
            username = ?,
            name = ?,
            role = ?
        WHERE id = ?
        `,
        [
            username,
            name,
            role,
            id
        ]
    );

    return result;
}


// ========================================
// UPDATE PASSWORD
// ========================================

async function updateUserPassword(
    id,
    password
) {

    const [result] = await pool.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
            password,
            id
        ]
    );

    return result;
}


// ========================================
// HAPUS USER
// ========================================

async function deleteUser(id) {

    const [result] = await pool.query(
        `
        DELETE FROM users
        WHERE id = ?
        `,
        [id]
    );

    return result;
}

// ========================================
// EXPORT
// ========================================

module.exports = {

    findUserByUsername,

    findUserById,

    findAllUsers,

    createUser,

    updateUser,

    updateUserPassword,

    deleteUser

};