const { pool } = require("../config/db");


// ============================================================
// BUAT LOG AKTIVITAS
// ============================================================

async function createLog(
    userId,
    action,
    line = null,
    productionDate = null,
    shift = null,
    product = null
) {

    const [result] = await pool.query(
        `
        INSERT INTO activity_logs
            (
                user_id,
                username,
                name,
                action,
                line,
                production_date,
                shift,
                product
            )
        SELECT
            id,
            username,
            name,
            ?,
            ?,
            ?,
            ?,
            ?
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [
            action,
            line,
            productionDate,
            shift,
            product,
            userId
        ]
    );

    return result.insertId;
}


// ============================================================
// AMBIL SEMUA LOG
// ============================================================

async function findAllLogs() {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            user_id,
            username,
            name,
            action,
            line,
            production_date,
            shift,
            product,
            created_at

        FROM activity_logs

        ORDER BY
            created_at DESC,
            id DESC
        `
    );

    return rows;
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    createLog,

    findAllLogs

};