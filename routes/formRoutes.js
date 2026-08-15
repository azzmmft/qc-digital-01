const express = require("express");
const router = express.Router();

const LINE_PRODUCTS = require("../config/lineProducts");

const {
    getSheetData,
    saveShiftData
} = require("../services/googleSheetsService");


// ========================================
// HELPER
// ========================================

/**
 * Karena form memiliki versi MOBILE dan DESKTOP
 * yang sama-sama ada di DOM, beberapa field
 * bisa diterima sebagai array.
 *
 * Contoh:
 *
 * AA: ["320", "320"]
 *
 * Kita ambil nilai pertama yang tidak kosong.
 */
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


// ========================================
// PARSE DATA DARI GOOGLE SHEETS
// ========================================

function parseQCData(sheetData, product) {

    const data = {};


    // ========================================
    // NORMALISASI ANGKA
    // ========================================

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


    // ========================================
    // BACA DATA QC
    // ========================================

    for (let i = 6; i < sheetData.length; i++) {

        const row = sheetData[i];


        // Lewati baris kosong
        if (!row || row.length === 0) {
            continue;
        }


        const shift = row[0];
        const rowNumber = row[1];


        // Lewati jika shift / row kosong
        if (!shift || !rowNumber) {
            continue;
        }


        // Buat object shift jika belum ada
        if (!data[shift]) {
            data[shift] = {};
        }


        // ========================================
        // TPH
        // ========================================

        if (product === "TPH") {

            data[shift][rowNumber] = {

                AA: normalizeNumber(row[2]),

                OT: normalizeNumber(row[3]),

                AA_RETEST: normalizeNumber(row[4]),

                OT_RETEST: normalizeNumber(row[5])

            };

        }


        // ========================================
        // LM
        // ========================================

        else {

            data[shift][rowNumber] = {

                AA: normalizeNumber(row[2]),

                OT: normalizeNumber(row[3]),

                BBT: normalizeNumber(row[4]),

                N2: normalizeNumber(row[5])

            };

        }

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
        // PRODUK
        // ========================================

        const selectedProduct =
            LINE_PRODUCTS[selectedLine];


        // ========================================
        // NAMA WORKSHEET
        // ========================================

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
        // PARSE EXISTING DATA
        // ========================================

        const existingData =
            parseQCData(
                sheetData,
                selectedProduct
            );


        console.log(
            "Existing Data:",
            existingData
        );


        // ========================================
        // RENDER FORM
        // ========================================

        res.render("form", {

            lines:
                Object.keys(LINE_PRODUCTS),

            lineProducts:
                LINE_PRODUCTS,

            selectedLine,

            selectedDate,

            selectedProduct,

            currentShift,

            sheetData,

            existingData

        });


    } catch (error) {

        console.error(
            "Gagal membuka form:"
        );

        console.error(
            error
        );

        res.status(500).send(
            "Gagal mengambil data QC."
        );

    }

});


// ========================================
// SAVE SHIFT
// ========================================

router.post("/form/save", async (req, res) => {

    try {

        console.log("");
        console.log("================================");
        console.log("MENYIMPAN DATA QC");
        console.log("================================");


        // ========================================
        // METADATA
        // ========================================

        const line =
            req.body.line;

        const date =
            req.body.date;

        const product =
            req.body.product;

        const shift =
            Number(req.body.shift);


        console.log("Line    :", line);
        console.log("Date    :", date);
        console.log("Product :", product);
        console.log("Shift   :", shift);


        // ========================================
        // VALIDASI METADATA
        // ========================================

        if (!line) {
            throw new Error(
                "Line tidak ditemukan."
            );
        }


        if (!date) {
            throw new Error(
                "Tanggal tidak ditemukan."
            );
        }


        if (!product) {
            throw new Error(
                "Product tidak ditemukan."
            );
        }


        if (![1, 2, 3].includes(shift)) {
            throw new Error(
                "Shift harus 1, 2, atau 3."
            );
        }


        // ========================================
        // NAMA SHEET
        // ========================================

        const sheetName =
            "2026-01-03_L" + line;


        // ========================================
        // DATA FORM
        // ========================================

        const formData =
            req.body.data || [];


        console.log(
            "Jumlah data diterima:",
            formData.length
        );


        // ========================================
        // HARUS 24 ROW
        // ========================================

        if (
            !Array.isArray(formData) ||
            formData.length !== 24
        ) {

            throw new Error(
                `Data form harus memiliki 24 row. Diterima: ${formData.length}`
            );

        }


        // ========================================
        // BENTUKKAN 24 ROW
        // ========================================

        const rows = formData.map(
            (item, index) => {

                const rowNumber =
                    index + 1;


                // ====================================
                // TPH
                // ====================================

                if (product === "TPH") {

                    return {

                        row: rowNumber,

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


                // ====================================
                // LM
                // ====================================

                return {

                    row: rowNumber,

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


        // ========================================
        // DEBUG DATA SEBELUM SAVE
        // ========================================

        console.log(
            "Data yang akan disimpan:"
        );

        console.dir(
            rows,
            {
                depth: null
            }
        );


        // ========================================
        // SAVE KE GOOGLE SHEETS
        // ========================================

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


        console.log(
            "================================"
        );


        // ========================================
        // REDIRECT
        // ========================================

        res.redirect(
            `/form?line=${encodeURIComponent(line)}` +
            `&date=${encodeURIComponent(date)}` +
            `&shift=${shift}`
        );


    } catch (error) {

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

        console.error(
            error
        );


        res.status(500).send(
            `Gagal menyimpan data QC.<br><br>${error.message}`
        );

    }

});


module.exports = router;