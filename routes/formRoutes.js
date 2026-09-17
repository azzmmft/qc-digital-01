const express = require("express");
const router = express.Router();

const {
    requireLogin
} = require("../middleware/authMiddleware");

const LINE_PRODUCTS = require("../config/lineProducts");

const {
    getSheetData,
    saveShiftData,
    saveExaminerName,
    ensureSheetExists
} = require("../services/googleSheetsService");

const {
    createQCPDF
} = require("../services/pdfService");

const {
    createActivityLog
} = require("../services/userService");

const {
    getShiftStatus,
    isShiftEditable
} = require("../config/shiftSchedule");

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
// JUMLAH ROW PER LINE
// ============================================================

function getRowCount(line) {

    // Line 4 memiliki 24 row
    if (String(line) === "4") {
        return 24;
    }

    // Line lainnya memiliki 20 row
    return 20;
}

// ============================================================
// CEK APAKAH SATU ROW SUDAH LENGKAP
// ============================================================

function isQCRowComplete(rowData, product) {

    if (!rowData) {
        return false;
    }


    // ========================================================
    // TPH
    // AA + OT wajib
    // Retest TIDAK dihitung
    // ========================================================

    if (product === "TPH") {

        return (
            String(rowData.AA || "").trim() !== "" &&
            String(rowData.OT || "").trim() !== ""
        );

    }


    // ========================================================
    // LM
    // AA + OT + BBT + N2 wajib
    // ========================================================

    return (
        String(rowData.AA || "").trim() !== "" &&
        String(rowData.OT || "").trim() !== "" &&
        String(rowData.BBT || "").trim() !== "" &&
        String(rowData.N2 || "").trim() !== ""
    );
}

// ============================================================
// CEK APAKAH SATU SHIFT SUDAH FULL
// ============================================================

function isShiftComplete(existingData, shift, product, rowCount) {

    const shiftData =
        existingData?.[String(shift)] ||
        existingData?.[shift] ||
        {};


    for (
        let rowNumber = 1;
        rowNumber <= rowCount;
        rowNumber++
    ) {

        const rowData =
            shiftData[rowNumber];

        if (
            !isQCRowComplete(
                rowData,
                product
            )
        ) {

            return false;

        }

    }


    return true;
}

// ============================================================
// VALIDASI ROW HARUS BERURUTAN
// ============================================================

function validateSequentialRows(
    rows,
    product,
    rowCount
) {

    let foundIncompleteRow = false;


    for (
        let i = 0;
        i < rowCount;
        i++
    ) {

        const row =
            rows[i] || {};


        const complete =
            isQCRowComplete(
                row,
                product
            );


        // ====================================================
        // Kalau row sudah tidak lengkap,
        // maka row setelahnya tidak boleh punya data
        // ====================================================

        if (!complete) {

            foundIncompleteRow = true;

            continue;

        }


        // ====================================================
        // Kalau sebelumnya sudah ada row kosong/tidak lengkap,
        // lalu sekarang ada row lengkap → lompat row
        // ====================================================

        if (foundIncompleteRow) {

            throw new Error(
                `Pengisian row harus berurutan. Row ${i + 1} terisi sementara row sebelumnya belum lengkap.`
            );

        }

    }
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
                AA: normalizeNumber(row[2]),
                OT: normalizeNumber(row[3]),
                AA_RETEST: normalizeNumber(row[4]),
                OT_RETEST: normalizeNumber(row[5]),
                examinerName: row[6] || ""
            };

        }


        // ====================================================
        // LM
        // ====================================================

        else {

            data[shift][rowNumber] = {
                AA: normalizeNumber(row[2]),
                OT: normalizeNumber(row[3]),
                BBT: normalizeNumber(row[4]),
                N2: normalizeNumber(row[5]),
                examinerName: row[6] || ""
            };

        }

    }

    return data;
}

// ========================================
// AMBIL NAMA PEMERIKSA
// ========================================

function getExaminerName(existingData, shift) {

    const shiftData =
        existingData?.[String(shift)] ||
        existingData?.[shift];

    if (!shiftData) {
        return "";
    }

    for (const rowNumber of Object.keys(shiftData)) {

        const examiner =
            shiftData[rowNumber]?.examinerName;

        if (
            examiner &&
            String(examiner).trim() !== ""
        ) {
            return String(examiner).trim();
        }
    }

    return "";
}


// ============================================================
// SELECT REPORT
// ============================================================

router.get(
    "/select-report",
    requireLogin,
    (req, res) => {
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
            `&shift=${shift}` +
            `&saved=1`
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

router.get(
    "/form",
    requireLogin,
    async (req, res) => {

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

        const saved = req.query.saved === "1";


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
        // AUTO CREATE SHEET DARI TEMPLATE
        // ====================================================

        await ensureSheetExists(
            sheetName
        );


        // ====================================================
        // READ GOOGLE SHEETS
        // ====================================================

        const sheetData =
            await getSheetData(
                sheetName
            );


        console.log(
            `Data ${sheetName}:`,
            sheetData
        );

        const examinerCells = {
            1: sheetData[0]?.[7] || "",
            2: sheetData[1]?.[7] || "",
            3: sheetData[2]?.[7] || ""
        };


        // ====================================================
        // PARSE EXISTING DATA
        // ====================================================

        const existingData =
            parseQCData(
                sheetData,
                selectedProduct
            );
        
        // ====================================================
        // STATUS SETIAP SHIFT
        // ====================================================

        const rowCount =
            getRowCount(selectedLine);

        const shiftStatus = {
            1: isShiftComplete(
                existingData,
                1,
                selectedProduct,
                rowCount
            ),

            2: isShiftComplete(
                existingData,
                2,
                selectedProduct,
                rowCount
            ),

            3: isShiftComplete(
                existingData,
                3,
                selectedProduct,
                rowCount
            )
        };
        const currentShiftStatus =
            getShiftStatus(
                dateISO,
                currentShift
            );
        console.log(
            "Status Shift:",
            shiftStatus
        );    

        console.log("");
        console.log("================================");
        console.log("DEBUG DATA SETELAH SAVE");
        console.log("================================");

        console.log("Sheet Data:");
        console.dir(sheetData, {
            depth: null
        });

        console.log("Existing Data:");
        console.dir(existingData, {
            depth: null
        });

        console.log("Current Shift:");
        console.log(currentShift);

        console.log("Current Shift Data:");
        console.dir(
            existingData?.[String(currentShift)],
            {
                depth: null
            }
        );

        console.log("================================");    
    

        console.log(
            "Existing Data:",
            existingData
        );

        const examinerName =
            getExaminerName(
                existingData,
                currentShift
            );

        console.log(
            "Nama Pemeriksa:",
            examinerName || "(belum ada)"
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

                existingData,

                examinerName,
                
                shiftStatus,

                currentShiftStatus,

                saved

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

// ========================================
// SAVE SHIFT
// ========================================

router.post(
    "/form/save",
    requireLogin,
    async (req, res) => {

    try {

        console.log("");
        console.log("================================");
        console.log("MENYIMPAN DATA QC");
        console.log("================================");


        // ========================================
        // METADATA
        // ========================================

        const line =
            String(req.body.line || "").trim();

        const dateISO =
            String(req.body.date || "").trim();

        const product =
            String(req.body.product || "").trim();

        const shift =
            Number(req.body.shift);

        console.log("BODY DITERIMA:");
        console.dir(req.body, {
            depth: null
        });

        const examinerName =
            normalizeFormValue(
                req.body.examinerName
            ).trim();

        console.log("================================");
        console.log("DEBUG EXAMINER");
        console.log("req.body.examinerName :", req.body.examinerName);
        console.log("typeof                 :", typeof req.body.examinerName);
        console.log("FULL BODY:");
        console.dir(req.body, {
            depth: null
        });
        console.log("================================");


        console.log("Line       :", line);
        console.log("Date ISO   :", dateISO);
        console.log("Product    :", product);
        console.log("Shift      :", shift);
        console.log(
            "Examiner   :",
            examinerName || "(kosong)"
        );


        // ========================================
        // VALIDASI LINE
        // ========================================

        if (!line) {

            throw new Error(
                "Line tidak ditemukan."
            );

        }


        if (!LINE_PRODUCTS[line]) {

            throw new Error(
                `Line ${line} tidak terdaftar.`
            );

        }


        // ========================================
        // VALIDASI TANGGAL
        // ========================================

        if (!dateISO) {

            throw new Error(
                "Tanggal produksi tidak ditemukan."
            );

        }


        // Pastikan format YYYY-MM-DD

        const isoDateRegex =
            /^\d{4}-\d{2}-\d{2}$/;


        if (!isoDateRegex.test(dateISO)) {

            throw new Error(
                `Format tanggal tidak valid: ${dateISO}`
            );

        }


        // Pastikan benar-benar tanggal valid

        const parsedDate =
            new Date(`${dateISO}T00:00:00`);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            throw new Error(
                `Tanggal produksi tidak valid: ${dateISO}`
            );

        }


        // ========================================
        // VALIDASI PRODUCT
        // ========================================

        if (
            product !== "TPH" &&
            product !== "LM"
        ) {

            throw new Error(
                `Product tidak valid: ${product}`
            );

        }


        // Pastikan product sesuai dengan line

        const expectedProduct =
            LINE_PRODUCTS[line];


        if (expectedProduct !== product) {

            throw new Error(
                `Product ${product} tidak sesuai dengan Line ${line}.`
            );

        }


        // ========================================
        // VALIDASI SHIFT
        // ========================================

        if (
            ![1, 2, 3].includes(shift)
        ) {

            throw new Error(
                "Shift harus 1, 2, atau 3."
            );

        }
        // ========================================
        // VALIDASI WAKTU SHIFT
        // ========================================

        const shiftEditable =
            isShiftEditable(
                dateISO,
                shift
            );

        if (!shiftEditable) {

            throw new Error(
                `Pengisian tidak dapat dilakukan. ` +
                `Shift ${shift} untuk tanggal produksi ${dateISO} ` +
                `sedang tidak dalam waktu pengisian.`
            );

        }

        // ========================================
        // NAMA SHEET DINAMIS
        // ========================================

        const sheetName =
            `${dateISO}_L${line}`;


        console.log("");
        console.log("TARGET GOOGLE SHEETS");
        console.log("--------------------------------");
        console.log("Sheet :", sheetName);
        console.log("Line  :", line);
        console.log("Date  :", dateISO);
        console.log("Shift :", shift);
        console.log("--------------------------------");


        // ========================================
        // DATA FORM
        // ========================================

        const formData =
            req.body.data || [];


        console.log(
            "Jumlah data diterima:",
            Array.isArray(formData)
                ? formData.length
                : "BUKAN ARRAY"
        );


        // ========================================
        // VALIDASI FORM DATA
        // ========================================

        if (!Array.isArray(formData)) {

            throw new Error(
                "Data form tidak valid."
            );

        }



        // ========================================
        // JUMLAH ROW SESUAI LINE
        // ========================================

        const rowCount =
            getRowCount(line);

        console.log(
            "Jumlah row untuk line:",
            rowCount
        );


        // ========================================
        // BENTUKKAN DATA
        //
        // Tidak harus semua row dikirim.
        // Row yang belum diisi dianggap kosong.
        // ========================================

        const rows =
            Array.from(
                {
                    length: rowCount
                },
                (_, index) => {

                    const item =
                        formData[index] || {};

                    const rowNumber =
                        index + 1;


                    // ====================================
                    // TPH
                    // ====================================

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


                    // ====================================
                    // LM
                    // ====================================

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


        // ========================================
        // VALIDASI URUTAN ROW
        // ========================================

        validateSequentialRows(
            rows,
            product,
            rowCount
        );


        console.log(
            "Validasi urutan row: BERHASIL"
        );


        // ========================================
        // DEBUG
        // ========================================

        console.log("");
        console.log("DATA YANG AKAN DISIMPAN:");
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


        console.log("");
        console.log("SAVE BERHASIL:");
        console.log(result);
        
        const examinerResult =
            await saveExaminerName(
                sheetName,
                shift,
                examinerName
            );

        console.log(
            "Examiner:",
            examinerName || "(belum disimpan)"
        );


        console.log(
            "================================"
        );

        // ========================================
        // ACTIVITY LOG
        // ========================================

        const currentUser =
            req.session.user;

        await createActivityLog({

            userId:
                currentUser.id,

            username:
                currentUser.username,

            name:
                currentUser.name,

            action:
                "Menyimpan data QC",

            line,

            productionDate:
                dateISO,

            shift,

            product

        });

        console.log(
            "Activity log berhasil disimpan."
        );

        // ========================================
        // REDIRECT KEMBALI KE FORM
        // ========================================

        res.redirect(
            `/form?line=${encodeURIComponent(line)}` +
            `&date=${encodeURIComponent(dateISO)}` +
            `&shift=${shift}` +
            `&saved=1`
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

        console.error(error);


        if (!res.headersSent) {

            res.status(500).send(
                `Gagal menyimpan data QC.<br><br>${error.message}`
            );

        }

    }

});


// ============================================================
// DOWNLOAD PDF
// ============================================================

router.get(
    "/form/pdf",
    requireLogin,
    async (req, res) => {

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