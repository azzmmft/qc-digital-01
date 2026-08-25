const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const {
    findUserByUsername
} = require("../services/userService");


// ========================================
// HALAMAN LOGIN
// ========================================

router.get("/login", (req, res) => {

    res.render("login", {
        error: null
    });

});


// ========================================
// PROSES LOGIN
// ========================================

router.post("/login", async (req, res) => {

    try {

        const username =
            String(req.body.username || "").trim();

        const password =
            String(req.body.password || "");

        // ========================================
        // VALIDASI INPUT
        // ========================================

        if (!username || !password) {

            return res.status(400).render(
                "login",
                {
                    error: "Username dan password wajib diisi."
                }
            );

        }


        // ========================================
        // CARI USER
        // ========================================

        const user =
            await findUserByUsername(username);


        // ========================================
        // USER TIDAK DITEMUKAN
        // ========================================

        if (!user) {

            return res.status(401).render(
                "login",
                {
                    error: "Username atau password salah."
                }
            );

        }


        // ========================================
        // CEK PASSWORD
        // ========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).render(
                "login",
                {
                    error: "Username atau password salah."
                }
            );

        }


        // ========================================
        // LOGIN BERHASIL
        // ========================================

        console.log("");
        console.log("================================");
        console.log("LOGIN BERHASIL");
        console.log("================================");
        console.log("ID       :", user.id);
        console.log("Username :", user.username);
        console.log("Name     :", user.name);
        console.log("Role     :", user.role);
        console.log("================================");

        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
        };
        // ========================================
        // REDIRECT BERDASARKAN ROLE
        // ========================================

        if (user.role === "admin") {

            return res.redirect("/admin");

        }

        if (user.role === "pengisi") {

            return res.redirect("/select-report");

        }

        // Role tidak dikenali
        return res.status(403).send(
            "Role user tidak dikenali."
        );
    }

    catch (error) {

        console.error("Gagal melakukan login:");
        console.error(error);

        return res.status(500).render(
            "login",
            {
                error: "Terjadi kesalahan pada server."
            }
        );

    }

});

// ========================================
// LOGOUT
// ========================================

router.get("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error("Gagal logout:");
            console.error(error);

            return res.status(500).send(
                "Gagal melakukan logout."
            );

        }

        res.redirect("/login");

    });

});


module.exports = router;