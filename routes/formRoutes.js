const express = require("express");
const router = express.Router();

const LINE_PRODUCTS = require("../config/lineProducts");

router.get("/form", (req, res) => {

    res.render("form", {
        lines: Object.keys(LINE_PRODUCTS),
        lineProducts: LINE_PRODUCTS
    });

});

module.exports = router;