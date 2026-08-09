const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Parse JSON
app.use(express.json());


// Test route
app.get("/", (req, res) => {
    res.render("login");
});


app.listen(PORT, () => {
    console.log(`QC Digital running at http://localhost:${PORT}`);
});