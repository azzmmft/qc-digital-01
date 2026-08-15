const express = require("express");
const router = express.Router();

const LINE_PRODUCTS = require("../config/lineProducts");

const {
    getSheetData
} = require("../services/googleSheetsService");


// ========================================
// PARSE DATA DARI GOOGLE SHEETS
// ========================================

function parseQCData(sheetData) {

    const data = {};

    // ========================================
    // NORMALISASI ANGKA
    // ========================================

    function normalizeNumber(value) {

        if (value === undefined || value === null || value === "") {
            return "";
        }

        return String(value).replace(",", ".");
    }


    /*
     * Struktur data QC di spreadsheet:
     *
     * Row spreadsheet:
     * 1 - header / informasi laporan
     * ...
     * 7 dst - data QC
     *
     * Struktur kolom:
     *
     * A = SHIFT
     * B = ROW
     * C = AA
     * D = OT
     * E = BBT
     * F = N2
     */

    for (let i = 6; i < sheetData.length; i++) {

        const row = sheetData[i];

        // Lewati baris kosong
        if (!row || row.length === 0) {
            continue;
        }

        const shift = row[0];
        const rowNumber = row[1];

        // Lewati jika shift / nomor row kosong
        if (!shift || !rowNumber) {
            continue;
        }

        // Jika shift belum ada, buat object baru
        if (!data[shift]) {
            data[shift] = {};
        }

        // Simpan data berdasarkan nomor row
        data[shift][rowNumber] = {

            AA: normalizeNumber(row[2]),
            OT: normalizeNumber(row[3]),
            BBT: normalizeNumber(row[4]),
            N2: normalizeNumber(row[5])

        };

    }

    return data;
}


// ========================================
// FORM PAGE
// ========================================

router.get("/form", async (req, res) => {

    try {

        // ========================================
        // DATA DASAR
        // ========================================

        const selectedLine =
            req.query.line || "10";

        const selectedDate =
            req.query.date || "03 Januari 2026";

        const currentShift =
            Number(req.query.shift) || 1;


        // ========================================
        // PRODUK BERDASARKAN LINE
        // ========================================

        const selectedProduct =
            LINE_PRODUCTS[selectedLine];


        // ========================================
        // NAMA WORKSHEET
        // ========================================

        /*
         * Untuk sementara tanggal masih menggunakan
         * tanggal testing.
         *
         * Nanti kita buat otomatis berdasarkan
         * tanggal yang dipilih user.
         */

        const sheetName =
            "2026-01-03_L" + selectedLine;


        console.log("================================");
        console.log("MEMBUKA FORM QC");
        console.log("Line       :", selectedLine);
        console.log("Product    :", selectedProduct);
        console.log("Shift      :", currentShift);
        console.log("Sheet      :", sheetName);
        console.log("================================");


        // ========================================
        // READ GOOGLE SHEETS
        // ========================================

        const sheetData =
            await getSheetData(sheetName);


        console.log(
            `Data ${sheetName}:`,
            sheetData
        );


        // ========================================
        // PARSE DATA EXISTING
        // ========================================

        const existingData =
            parseQCData(sheetData);


        console.log(
            "Existing Data:",
            existingData
        );


        // ========================================
        // RENDER FORM
        // ========================================

        res.render("form", {

            // Daftar line
            lines: Object.keys(LINE_PRODUCTS),

            // Mapping line → product
            lineProducts: LINE_PRODUCTS,

            // Data pilihan user
            selectedLine,
            selectedDate,
            selectedProduct,
            currentShift,

            // Data spreadsheet mentah
            sheetData,

            // Data yang sudah diparsing
            existingData

        });


    } catch (error) {

        console.error(
            "Gagal membuka form:"
        );

        console.error(
            error.message
        );

        res.status(500).send(
            "Gagal mengambil data QC."
        );

    }

});


module.exports = router;