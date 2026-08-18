const express = require("express");
const router = express.Router();

const LINE_PRODUCTS = require("../config/lineProducts");

const {
    getSheetData,
    saveShiftData
} = require("../services/googleSheetsService");

const {
    createQCPDF
} = require("../services/pdfService");


// ============================================================
// HELPER
// ============================================================

function normalizeFormValue(value) {

    if (Array.isArray(value)) {

        const nonEmptyValue = value.find(
            item =>
                item !== undefined &&
                item !== null &&
                String(item).trim() !== ""
        );

        return nonEmptyValue ?? "";
    }

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value);
}


// ============================================================
// VALIDASI TANGGAL ISO
// ============================================================

function isValidISODate(dateString) {

    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        return false;
    }

    const [year, month, day] =
        dateString.split("-").map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}


// ============================================================
// FORMAT TANGGAL INDONESIA
// ============================================================

function formatIndonesianDate(dateISO) {

    if (!isValidISODate(dateISO)) {
        return dateISO;
    }

    const [year, month, day] =
        dateISO.split("-").map(Number);

    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    return `${day} ${monthNames[month - 1]} ${year}`;
}


// ============================================================
// NAMA SHEET
// ============================================================

function getSheetName(dateISO, line) {

    return `${dateISO}_L${line}`;
}


// ============================================================
// PARSE DATA GOOGLE SHEETS
// ============================================================

function parseQCData(sheetData, product) {

    const data = {};

    function normalizeNumber(value) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "";
        }

        return String(value).replace(",", ".");
    }


    for (let i = 6; i < sheetData.length; i++) {

        const row = sheetData[i];

        if (!row || row.length === 0) {
            continue;
        }

        const shift = row[0];
        const rowNumber = row[1];

        if (!shift || !rowNumber) {
            continue;
        }

        if (!data[shift]) {
            data[shift] = {};
        }


        // ====================================================
        // TPH
        // ====================================================

        if (product === "TPH") {

            data[shift][rowNumber] = {

                AA:
                    normalizeNumber(row[2]),

                OT:
                    normalizeNumber(row[3]),

                AA_RETEST:
                    normalizeNumber(row[4]),

                OT_RETEST:
                    normalizeNumber(row[5])

            };

        }


        // ====================================================
        // LM
        // ====================================================

        else {

            data[shift][rowNumber] = {

                AA:
                    normalizeNumber(row[2]),

                OT:
                    normalizeNumber(row[3]),

                BBT:
                    normalizeNumber(row[4]),

                N2:
                    normalizeNumber(row[5])

            };

        }

    }

    return data;
}


// ============================================================
// SELECT REPORT
// ============================================================

router.get("/select-report", (req, res) => {

    try {

        const date =
            String(req.query.date || "").trim();

        const line =
            String(req.query.line || "").trim();

        const shift =
            Number(req.query.shift) || 1;


        // ====================================================
        // BUKA HALAMAN SELECT REPORT
        // ====================================================

        if (!date && !line) {

            return res.render(
                "select-report",
                {
                    lines:
                        Object.keys(LINE_PRODUCTS),

                    lineProducts:
                        LINE_PRODUCTS
                }
            );

        }


        // ====================================================
        // VALIDASI INPUT
        // ====================================================

        if (!date || !line) {

            return res.status(400).send(
                "Tanggal produksi dan line wajib dipilih."
            );

        }


        if (!isValidISODate(date)) {

            return res.status(400).send(
                `Format tanggal tidak valid: ${date}`
            );

        }


        if (!LINE_PRODUCTS[line]) {

            return res.status(400).send(
                `Line ${line} tidak ditemukan.`
            );

        }


        if (![1, 2, 3].includes(shift)) {

            return res.status(400).send(
                "Shift harus 1, 2, atau 3."
            );

        }


        // ====================================================
        // REDIRECT KE FORM
        // ====================================================

        return res.redirect(
            `/form?line=${encodeURIComponent(line)}` +
            `&date=${encodeURIComponent(date)}` +
            `&shift=${shift}`
        );

    }

    catch (error) {

        console.error(
            "Gagal membuka halaman Select Report:"
        );

        console.error(error);

        return res.status(500).send(
            `Gagal membuka halaman pilih laporan.<br><br>${error.message}`
        );

    }

});


// ============================================================
// FORM PAGE
// ============================================================

router.get("/form", async (req, res) => {

    try {

        console.log("");
        console.log("================================");
        console.log("MEMBUKA FORM QC");
        console.log("================================");


        // ====================================================
        // PARAMETER
        // ====================================================

        const selectedLine =
            req.query.line || "10";

        const dateISO =
            req.query.date;

        const currentShift =
            Number(req.query.shift) || 1;


        // ====================================================
        // VALIDASI TANGGAL
        // ====================================================

        if (!dateISO) {

            return res.redirect(
                "/select-report"
            );

        }


        if (!isValidISODate(dateISO)) {

            return res.status(400).send(
                `Format tanggal tidak valid: ${dateISO}`
            );

        }


        // ====================================================
        // VALIDASI SHIFT
        // ====================================================

        if (
            ![1, 2, 3].includes(currentShift)
        ) {

            return res.status(400).send(
                "Shift harus 1, 2, atau 3."
            );

        }


        // ====================================================
        // VALIDASI LINE
        // ====================================================

        if (!LINE_PRODUCTS[selectedLine]) {

            return res.status(400).send(
                `Line ${selectedLine} tidak ditemukan.`
            );

        }


        // ====================================================
        // PRODUK
        // ====================================================

        const selectedProduct =
            LINE_PRODUCTS[selectedLine];


        // ====================================================
        // TANGGAL UNTUK TAMPILAN
        // ====================================================

        const selectedDate =
            formatIndonesianDate(dateISO);


        // ====================================================
        // NAMA SHEET
        // ====================================================

        const sheetName =
            getSheetName(
                dateISO,
                selectedLine
            );


        console.log(
            "Tanggal ISO :",
            dateISO
        );

        console.log(
            "Tanggal UI  :",
            selectedDate
        );

        console.log(
            "Line        :",
            selectedLine
        );

        console.log(
            "Product     :",
            selectedProduct
        );

        console.log(
            "Shift       :",
            currentShift
        );

        console.log(
            "Sheet       :",
            sheetName
        );


        // ====================================================
        // READ GOOGLE SHEETS
        // ====================================================

        const sheetData =
            await getSheetData(sheetName);


        console.log(
            `Data ${sheetName}:`,
            sheetData
        );


        // ====================================================
        // PARSE EXISTING DATA
        // ====================================================

        const existingData =
            parseQCData(
                sheetData,
                selectedProduct
            );


        console.log(
            "Existing Data:",
            existingData
        );


        // ====================================================
        // RENDER FORM
        // ====================================================

        res.render(
            "form",
            {

                lines:
                    Object.keys(LINE_PRODUCTS),

                lineProducts:
                    LINE_PRODUCTS,

                selectedLine,

                selectedDate,

                // Supaya kalau form.ejs
                // masih menggunakan displayDate
                // tidak error.
                displayDate:
                    selectedDate,

                // Format ISO
                // untuk hidden input,
                // URL shift, PDF, dan sheet.
                dateISO,

                selectedProduct,

                currentShift,

                sheetData,

                existingData

            }
        );

    }

    catch (error) {

        console.error("");
        console.error(
            "================================"
        );

        console.error(
            "GAGAL MEMBUKA FORM QC"
        );

        console.error(
            "================================"
        );

        console.error(error);


        res.status(500).send(
            `Gagal mengambil data QC.<br><br>${error.message}`
        );

    }

});


// ============================================================
// SAVE SHIFT
// ============================================================

router.post("/form/save", async (req, res) => {

    try {

        console.log("");
        console.log("================================");
        console.log("MENYIMPAN DATA QC");
        console.log("================================");


        // ====================================================
        // METADATA
        // ====================================================

        const line =
            req.body.line;

        const dateISO =
            req.body.date;

        const product =
            req.body.product;

        const shift =
            Number(req.body.shift);


        console.log(
            "Line    :",
            line
        );

        console.log(
            "Date    :",
            dateISO
        );

        console.log(
            "Product :",
            product
        );

        console.log(
            "Shift   :",
            shift
        );


        // ====================================================
        // VALIDASI
        // ====================================================

        if (!line) {

            throw new Error(
                "Line tidak ditemukan."
            );

        }


        if (!dateISO) {

            throw new Error(
                "Tanggal tidak ditemukan."
            );

        }


        if (!isValidISODate(dateISO)) {

            throw new Error(
                `Tanggal tidak valid: ${dateISO}`
            );

        }


        if (!product) {

            throw new Error(
                "Product tidak ditemukan."
            );

        }


        if (
            ![1, 2, 3].includes(shift)
        ) {

            throw new Error(
                "Shift harus 1, 2, atau 3."
            );

        }


        // ====================================================
        // NAMA SHEET
        // ====================================================

        const sheetName =
            getSheetName(
                dateISO,
                line
            );


        console.log(
            "Sheet tujuan:",
            sheetName
        );


        // ====================================================
        // DATA FORM
        // ====================================================

        const formData =
            req.body.data || [];


        console.log(
            "Jumlah data diterima:",
            formData.length
        );


        // ====================================================
        // HARUS 24 ROW
        // ====================================================

        if (
            !Array.isArray(formData) ||
            formData.length !== 24
        ) {

            throw new Error(
                `Data form harus memiliki 24 row. Diterima: ${formData.length}`
            );

        }


        // ====================================================
        // BENTUKKAN ROW
        // ====================================================

        const rows =
            formData.map(
                (item, index) => {

                    const rowNumber =
                        index + 1;


                    // ========================================
                    // TPH
                    // ========================================

                    if (product === "TPH") {

                        return {

                            row:
                                rowNumber,

                            AA:
                                normalizeFormValue(
                                    item.AA
                                ),

                            OT:
                                normalizeFormValue(
                                    item.OT
                                ),

                            AA_RETEST:
                                normalizeFormValue(
                                    item.AA_RETEST
                                ),

                            OT_RETEST:
                                normalizeFormValue(
                                    item.OT_RETEST
                                )

                        };

                    }


                    // ========================================
                    // LM
                    // ========================================

                    return {

                        row:
                            rowNumber,

                        AA:
                            normalizeFormValue(
                                item.AA
                            ),

                        OT:
                            normalizeFormValue(
                                item.OT
                            ),

                        BBT:
                            normalizeFormValue(
                                item.BBT
                            ),

                        N2:
                            normalizeFormValue(
                                item.N2
                            )

                    };

                }
            );


        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
            "Data yang akan disimpan:"
        );

        console.dir(
            rows,
            {
                depth: null
            }
        );


        // ====================================================
        // SAVE GOOGLE SHEETS
        // ====================================================

        const result =
            await saveShiftData(
                sheetName,
                shift,
                rows,
                product
            );


        console.log(
            "SAVE BERHASIL:"
        );

        console.log(
            result
        );


        // ====================================================
        // REDIRECT
        // ====================================================

        res.redirect(
            `/form?line=${encodeURIComponent(line)}` +
            `&date=${encodeURIComponent(dateISO)}` +
            `&shift=${shift}`
        );

    }

    catch (error) {

        console.error("");
        console.error(
            "================================"
        );

        console.error(
            "GAGAL MENYIMPAN DATA QC"
        );

        console.error(
            "================================"
        );

        console.error(error);


        res.status(500).send(
            `Gagal menyimpan data QC.<br><br>${error.message}`
        );

    }

});


// ============================================================
// DOWNLOAD PDF
// ============================================================

router.get("/form/pdf", async (req, res) => {

    try {

        console.log("");
        console.log("================================");
        console.log("GENERATE QC PDF");
        console.log("================================");


        // ====================================================
        // PARAMETER
        // ====================================================

        const line =
            req.query.line || "10";

        const dateISO =
            req.query.date;


        // ====================================================
        // VALIDASI TANGGAL
        // ====================================================

        if (!dateISO) {

            throw new Error(
                "Tanggal PDF tidak ditemukan."
            );

        }


        if (!isValidISODate(dateISO)) {

            throw new Error(
                `Tanggal PDF tidak valid: ${dateISO}`
            );

        }


        // ====================================================
        // PRODUK
        // ====================================================

        const product =
            LINE_PRODUCTS[line];


        if (!product) {

            throw new Error(
                `Product untuk Line ${line} tidak ditemukan.`
            );

        }


        // ====================================================
        // TANGGAL PDF
        // ====================================================

        const date =
            formatIndonesianDate(
                dateISO
            );


        // ====================================================
        // NAMA SHEET
        // ====================================================

        const sheetName =
            getSheetName(
                dateISO,
                line
            );


        console.log(
            "Line       :",
            line
        );

        console.log(
            "Date ISO   :",
            dateISO
        );

        console.log(
            "Date PDF   :",
            date
        );

        console.log(
            "Product    :",
            product
        );

        console.log(
            "Sheet      :",
            sheetName
        );


        // ====================================================
        // AMBIL DATA GOOGLE SHEETS
        // ====================================================

        const sheetData =
            await getSheetData(
                sheetName
            );


        // ====================================================
        // PARSE DATA
        // ====================================================

        const existingData =
            parseQCData(
                sheetData,
                product
            );


        console.log(
            "Data untuk PDF:"
        );

        console.dir(
            existingData,
            {
                depth: null
            }
        );


        // ====================================================
        // GENERATE PDF
        // ====================================================

        createQCPDF(
            res,
            {

                date,

                dateISO,

                line,

                product,

                existingData

            }
        );

    }

    catch (error) {

        console.error("");
        console.error(
            "================================"
        );

        console.error(
            "GAGAL GENERATE PDF"
        );

        console.error(
            "================================"
        );

        console.error(error);


        if (!res.headersSent) {

            res.status(500).send(
                `Gagal membuat PDF.<br><br>${error.message}`
            );

        }

    }

});


module.exports = router;