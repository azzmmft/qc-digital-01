const express = require("express");
const router = express.Router();

const {
    requireAdmin
} = require("../middleware/authMiddleware");

const {
    findAllUsers,
    findUserByUsername,
    findUserById,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser
} = require("../services/userService");

const {
    findAllLogs
} = require("../services/logService");

const bcrypt = require("bcrypt");


// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
    "/admin",
    requireAdmin,
    (req, res) => {

        res.render("admin/dashboard", {
            user: req.session.user
        });

    }
);

// ============================================================
// ACTIVITY LOG
// ============================================================

router.get(
    "/admin/logs",
    requireAdmin,
    async (req, res) => {

        try {

            const logs =
                await findAllLogs();

            return res.render(
                "admin/logs",
                {
                    user: req.session.user,
                    logs
                }
            );

        }

        catch (error) {

            console.error(
                "Gagal mengambil log aktivitas:",
                error
            );

            return res.status(500).send(
                "Gagal mengambil log aktivitas."
            );

        }

    }
);


// ============================================================
// USER MANAGEMENT
// ============================================================

router.get(
    "/admin/users",
    requireAdmin,
    async (req, res) => {

        try {

            const users =
                await findAllUsers();

            res.render(
                "admin/users",
                {
                    user: req.session.user,
                    users,
                    currentUserId: req.session.user.id
                }
            );

        }

        catch (error) {

            console.error(
                "Gagal mengambil data user:",
                error
            );

            res.status(500).send(
                "Gagal mengambil data pengguna."
            );

        }

    }
);

// ============================================================
// FORM TAMBAH USER
// ============================================================

router.get(
    "/admin/users/create",
    requireAdmin,
    (req, res) => {

        return res.render(
            "admin/user-form",
            {
                user: req.session.user,
                error: null
            }
        );

    }
);

// ============================================================
// PROSES TAMBAH USER
// ============================================================

router.post(
    "/admin/users/create",
    requireAdmin,
    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );

            const role =
                String(
                    req.body.role || ""
                ).trim();


            // ========================================
            // VALIDASI
            // ========================================

            if (
                !username ||
                !name ||
                !password ||
                !role
            ) {

                return res.status(400).render(
                    "admin/user-form",
                    {
                        user: req.session.user,
                        error: "Semua field wajib diisi."
                    }
                );

            }


            if (
                !["admin", "pengisi"].includes(role)
            ) {

                return res.status(400).render(
                    "admin/user-form",
                    {
                        user: req.session.user,
                        error: "Role tidak valid."
                    }
                );

            }


            if (password.length < 6) {

                return res.status(400).render(
                    "admin/user-form",
                    {
                        user: req.session.user,
                        error:
                            "Password minimal 6 karakter."
                    }
                );

            }


            // ========================================
            // CEK USERNAME
            // ========================================

            const existingUser =
                await findUserByUsername(username);


            if (existingUser) {

                return res.status(400).render(
                    "admin/user-form",
                    {
                        user: req.session.user,
                        error:
                            "Username sudah digunakan."
                    }
                );

            }


            // ========================================
            // HASH PASSWORD
            // ========================================

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            // ========================================
            // INSERT
            // ========================================

            await createUser(
                username,
                hashedPassword,
                name,
                role
            );


            return res.redirect(
                "/admin/users"
            );

        }

        catch (error) {

            console.error(
                "Gagal membuat user:"
            );

            console.error(error);

            return res.status(500).send(
                "Gagal membuat user."
            );

        }

    }
);

// ============================================================
// FORM EDIT USER
// ============================================================

router.get(
    "/admin/users/:id/edit",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            if (!Number.isInteger(id)) {
                return res.status(400).send(
                    "ID user tidak valid."
                );
            }

            const editUser =
                await findUserById(id);

            if (!editUser) {
                return res.status(404).send(
                    "User tidak ditemukan."
                );
            }

            return res.render(
                "admin/user-edit",
                {
                    user: req.session.user,
                    editUser,
                    error: null
                }
            );

        }

        catch (error) {

            console.error(error);

            return res.status(500).send(
                "Gagal membuka halaman edit user."
            );

        }

    }
);


// ============================================================
// UPDATE USER
// ============================================================

router.post(
    "/admin/users/:id/update",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const role =
                String(
                    req.body.role || ""
                ).trim();


            if (
                !Number.isInteger(id) ||
                !username ||
                !name ||
                !["admin", "pengisi"].includes(role)
            ) {

                return res.status(400).send(
                    "Data user tidak valid."
                );

            }


            const existingUser =
                await findUserByUsername(username);


            if (
                existingUser &&
                Number(existingUser.id) !== id
            ) {

                return res.status(400).send(
                    "Username sudah digunakan."
                );

            }


            await updateUser(
                id,
                username,
                name,
                role
            );


            // Kalau admin mengubah role dirinya sendiri,
            // session harus ikut diperbarui.

            if (
                Number(req.session.user.id) === id
            ) {

                req.session.user.username =
                    username;

                req.session.user.name =
                    name;

                req.session.user.role =
                    role;

            }


            return res.redirect(
                "/admin/users"
            );

        }

        catch (error) {

            console.error(
                "Gagal update user:"
            );

            console.error(error);

            return res.status(500).send(
                "Gagal mengubah user."
            );

        }

    }
);


// ============================================================
// RESET PASSWORD
// ============================================================

router.post(
    "/admin/users/:id/password",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const password =
                String(
                    req.body.password || ""
                );


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).send(
                    "ID user tidak valid."
                );

            }


            if (password.length < 6) {

                return res.status(400).send(
                    "Password minimal 6 karakter."
                );

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            await updateUserPassword(
                id,
                hashedPassword
            );


            return res.redirect(
                `/admin/users/${id}/edit`
            );

        }

        catch (error) {

            console.error(
                "Gagal reset password:"
            );

            console.error(error);

            return res.status(500).send(
                "Gagal reset password."
            );

        }

    }
);

// ============================================================
// HAPUS USER
// ============================================================

router.post(
    "/admin/users/:id/delete",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            // ========================================
            // VALIDASI ID
            // ========================================

            if (!Number.isInteger(id)) {

                return res.status(400).send(
                    "ID user tidak valid."
                );

            }


            // ========================================
            // CEGAH ADMIN MENGHAPUS DIRI SENDIRI
            // ========================================

            if (
                Number(req.session.user.id) === id
            ) {

                return res.status(400).send(
                    "Anda tidak dapat menghapus akun sendiri."
                );

            }


            // ========================================
            // CEK USER
            // ========================================

            const targetUser =
                await findUserById(id);

            if (!targetUser) {

                return res.status(404).send(
                    "User tidak ditemukan."
                );

            }


            // ========================================
            // HAPUS USER
            // ========================================

            await deleteUser(id);


            // ========================================
            // KEMBALI KE USER MANAGEMENT
            // ========================================

            return res.redirect(
                "/admin/users"
            );

        }

        catch (error) {

            console.error(
                "Gagal menghapus user:"
            );

            console.error(error);

            return res.status(500).send(
                "Gagal menghapus user."
            );

        }

    }
);

module.exports = router;