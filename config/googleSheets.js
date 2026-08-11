const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "../credentials/qc-digital-505013-ca343d6cb100.json"
    ),
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets"
    ]
});

const sheets = google.sheets({
    version: "v4",
    auth
});

module.exports = sheets;