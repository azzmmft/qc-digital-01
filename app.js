const session = require("express-session");
const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false
}));

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Parse JSON
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const formRoutes = require("./routes/formRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use("/", authRoutes);
app.use("/", formRoutes);
app.use("/", adminRoutes);

// Home sementara → redirect ke form
app.get("/", (req, res) => {
    res.redirect("/login");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`QC Digital running on port ${PORT}`);
});