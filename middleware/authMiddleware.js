function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).send(
            "Akses ditolak. Halaman ini hanya untuk Admin."
        );
    }

    next();
}

function requirePengisi(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.role !== "pengisi") {
        return res.status(403).send(
            "Akses ditolak. Halaman ini hanya untuk Pengisi."
        );
    }

    next();
}

function requireRole(role) {
    return function (req, res, next) {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        if (req.session.user.role !== role) {
            return res.status(403).send(
                "403 - Anda tidak memiliki akses ke halaman ini."
            );
        }

        next();
    };
}

module.exports = {
    requireLogin,
    requireAdmin,
    requirePengisi,
    requireRole
};