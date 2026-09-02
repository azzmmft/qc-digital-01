const sheets = require("../config/googleSheets");

const spreadsheetId =
    process.env.GOOGLE_SPREADSHEET_ID;

const TEMPLATE_SHEET_NAME = "TEMPLATE_SHEET";

const {
    getDataRange,
    getShiftDataRange,
    getExaminerRange
} = require("../config/sheetMapping");


// ========================================
// READ
// ========================================

async function getSheetData(sheetName) {

    try {

        const response =
            await sheets.spreadsheets.values.get({

                spreadsheetId,

                range: sheetName

            });

        return response.data.values || [];

    } catch (error) {

        console.error(
            `Gagal membaca sheet ${sheetName}:`
        );

        console.error(
            error.message
        );

        throw error;

    }

}


// ========================================
// WRITE / UPDATE
// ========================================

async function updateRange(
    sheetName,
    range,
    values
) {

    try {

        await sheets.spreadsheets.values.update({

            spreadsheetId,

            range:
                `${sheetName}!${range}`,

            valueInputOption:
                "USER_ENTERED",

            requestBody: {

                values

            }

        });

        return true;

    } catch (error) {

        console.error(
            `Gagal menulis ke sheet ${sheetName}:`
        );

        console.error(
            error.message
        );

        throw error;

    }

}


// ========================================
// SAVE SATU ROW
// ========================================

async function saveRowData(
    sheetName,
    shift,
    row,
    values
) {

    const range =
        getDataRange(
            shift,
            row
        );

    await updateRange(

        sheetName,

        range,

        [[

            values.AA ?? "",

            values.OT ?? "",

            values.BBT ?? "",

            values.N2 ?? ""

        ]]

    );

    return {

        sheetName,

        shift,

        row,

        range

    };

}


// ========================================
// SAVE SATU SHIFT
// ========================================

async function saveShiftData(
    sheetName,
    shift,
    rows,
    product
) {

    // ========================================
    // VALIDASI SHIFT
    // ========================================

    if (
        ![1, 2, 3].includes(
            Number(shift)
        )
    ) {

        throw new Error(
            "Shift harus bernilai 1, 2, atau 3."
        );

    }


    // ========================================
    // VALIDASI ROW
    // ========================================

    if (!Array.isArray(rows)) {

        throw new Error(
            "Data rows harus berupa array."
        );

    }


    /*
     * Tidak lagi mewajibkan 24 row.
     *
     * Form boleh mengirim:
     * - 1 row
     * - 2 row
     * - 5 row
     * - 10 row
     * - dst.
     *
     * Validasi jumlah maksimal row dilakukan
     * berdasarkan line di formRoutes.
     *
     * Di service ini kita hanya memastikan
     * bahwa array tidak kosong.
     */

    if (rows.length === 0) {

        throw new Error(
            "Tidak ada data row yang akan disimpan."
        );

    }


    // ========================================
    // PRODUK
    // ========================================

    if (
        product !== "TPH" &&
        product !== "LM"
    ) {

        throw new Error(
            `Product tidak valid: ${product}`
        );

    }


    // ========================================
    // BENTUK DATA
    // ========================================

    const values =
        rows.map(
            (item, index) => {

                const expectedRow =
                    index + 1;


                // ====================================
                // VALIDASI NOMOR ROW
                // ====================================

                if (
                    Number(item.row) !==
                    expectedRow
                ) {

                    throw new Error(

                        `Urutan row tidak sesuai. ` +
                        `Expected: ${expectedRow}, ` +
                        `Received: ${item.row}`

                    );

                }


                // ====================================
                // TPH
                // ====================================

                if (product === "TPH") {

                    return [

                        item.AA ?? "",

                        item.OT ?? "",

                        item.AA_RETEST ?? "",

                        item.OT_RETEST ?? ""

                    ];

                }


                // ====================================
                // LM
                // ====================================

                return [

                    item.AA ?? "",

                    item.OT ?? "",

                    item.BBT ?? "",

                    item.N2 ?? ""

                ];

            }
        );


    // ========================================
    // RANGE SHIFT
    // ========================================

    const range =
        getShiftDataRange(
            Number(shift)
        );


    console.log("");
    console.log(
        "Menulis ke Google Sheets..."
    );

    console.log(
        "Sheet :",
        sheetName
    );

    console.log(
        "Shift :",
        shift
    );

    console.log(
        "Product :",
        product
    );

    console.log(
        "Range :",
        range
    );

    console.log(
        "Jumlah row :",
        values.length
    );


    // ========================================
    // WRITE DATA QC
    // ========================================

    /*
     * Kita hanya menulis row yang dikirim.
     *
     * Jadi kalau user mengisi 2 row:
     *
     * row 1 → tersimpan
     * row 2 → tersimpan
     *
     * row 3 dst tidak disentuh.
     */

    const startRow =
        getStartRowForShift(
            Number(shift)
        );


    const endRow =
        startRow + values.length - 1;


    /*
     * getShiftDataRange() sebelumnya kemungkinan
     * mengembalikan range penuh 20/24 row.
     *
     * Karena sekarang kita hanya ingin menulis
     * row yang diisi, kita buat range dinamis
     * berdasarkan jumlah values.
     */

    const dynamicRange =
        getDynamicShiftRange(
            Number(shift),
            values.length
        );


    console.log(
        "Dynamic Range :",
        dynamicRange
    );


    await updateRange(

        sheetName,

        dynamicRange,

        values

    );


    // ========================================
    // RETURN
    // ========================================

    return {

        sheetName,

        shift:
            Number(shift),

        product,

        rowsSaved:
            values.length,

        range:
            dynamicRange

    };

}


// ========================================
// RANGE AWAL SHIFT
// ========================================

function getStartRowForShift(shift) {

    /*
     * Sesuaikan dengan struktur Google Sheets
     * project kamu.
     *
     * Struktur yang selama ini digunakan:
     *
     * Shift 1 → baris data awal
     * Shift 2 → setelah area Shift 1
     * Shift 3 → setelah area Shift 2
     *
     * Karena mapping asli project sudah berada
     * di sheetMapping.js, fungsi ini mengambil
     * start row dari getShiftDataRange().
     */

    const fullRange =
        getShiftDataRange(
            shift
        );


    /*
     * Contoh:
     *
     * "A7:D26"
     *
     * maka start row = 7
     */

    const match =
        String(fullRange)
            .match(/^[A-Z]+(\d+):/);


    if (!match) {

        throw new Error(
            `Format range shift tidak dapat dibaca: ${fullRange}`
        );

    }


    return Number(match[1]);

}


// ========================================
// RANGE DINAMIS SHIFT
// ========================================

function getDynamicShiftRange(
    shift,
    rowCount
) {

    const fullRange =
        getShiftDataRange(
            shift
        );


    /*
     * Contoh full range:
     *
     * A7:D26
     *
     * kita ambil:
     *
     * startColumn = A
     * startRow    = 7
     */

    const match =
        String(fullRange)
            .match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);


    if (!match) {

        throw new Error(
            `Format range shift tidak valid: ${fullRange}`
        );

    }


    const startColumn =
        match[1];

    const startRow =
        Number(match[2]);

    const endColumn =
        match[3];


    const dynamicEndRow =
        startRow +
        rowCount -
        1;


    return (
        `${startColumn}${startRow}:` +
        `${endColumn}${dynamicEndRow}`
    );

}


// ========================================
// SAVE NAMA PEMERIKSA
// ========================================

async function saveExaminerName(
    sheetName,
    shift,
    examinerName
) {

    // ========================================
    // VALIDASI SHIFT
    // ========================================

    if (
        ![1, 2, 3].includes(
            Number(shift)
        )
    ) {

        throw new Error(
            "Shift pemeriksa harus 1, 2, atau 3."
        );

    }


    // ========================================
    // VALIDASI NAMA
    // ========================================

    const name =
        String(
            examinerName || ""
        ).trim();


    if (!name) {

        throw new Error(
            "Nama pemeriksa tidak boleh kosong."
        );

    }


    // ========================================
    // RANGE PEMERIKSA
    // ========================================

    const range =
        getExaminerRange(
            Number(shift)
        );


    /*
     * Nama pemeriksa tidak perlu 24 row.
     *
     * Kita cukup menyimpan nama pada range
     * yang memang sudah ditentukan oleh
     * sheetMapping.js.
     *
     * Karena Google Sheets akan mengisi nilai
     * sesuai range yang diberikan.
     */

    const fullRange =
        String(range);


    const match =
        fullRange.match(
            /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/
        );


    if (!match) {

        throw new Error(
            `Format range examiner tidak valid: ${range}`
        );

    }


    const startColumn =
        match[1];

    const startRow =
        Number(match[2]);

    const endColumn =
        match[3];

    const endRow =
        Number(match[4]);


    const rowCount =
        endRow -
        startRow +
        1;


    // ========================================
    // BUAT DATA NAMA
    // ========================================

    const values =
        Array.from(
            {
                length: rowCount
            },
            () => [name]
        );


    console.log("");
    console.log(
        "Menyimpan nama pemeriksa..."
    );

    console.log(
        "Sheet :",
        sheetName
    );

    console.log(
        "Shift :",
        shift
    );

    console.log(
        "Nama  :",
        name
    );

    console.log(
        "Range :",
        range
    );


    // ========================================
    // WRITE
    // ========================================

    await updateRange(

        sheetName,

        range,

        values

    );


    // ========================================
    // RETURN
    // ========================================

    return {

        sheetName,

        shift:
            Number(shift),

        examinerName:
            name,

        range

    };

}

// ========================================
// AUTO CREATE SHEET DARI TEMPLATE
// ========================================

async function ensureSheetExists(sheetName) {

    try {

        // ========================================
        // VALIDASI NAMA SHEET
        // ========================================

        if (!sheetName) {

            throw new Error(
                "Nama sheet tidak boleh kosong."
            );

        }


        // ========================================
        // AMBIL SEMUA SHEET
        // ========================================

        const spreadsheet =
            await sheets.spreadsheets.get({

                spreadsheetId,

                fields:
                    "sheets.properties"

            });


        const sheetList =
            spreadsheet.data.sheets || [];


        // ========================================
        // CEK APAKAH SHEET SUDAH ADA
        // ========================================

        const existingSheet =
            sheetList.find(
                sheet =>
                    sheet.properties.title === sheetName
            );


        if (existingSheet) {

            console.log("");
            console.log(
                "Sheet sudah tersedia."
            );

            console.log(
                "Sheet :",
                sheetName
            );

            console.log(
                "Sheet ID :",
                existingSheet.properties.sheetId
            );

            return {

                created: false,

                sheetName,

                sheetId:
                    existingSheet.properties.sheetId

            };

        }


        // ========================================
        // CARI TEMPLATE
        // ========================================

        const templateSheet =
            sheetList.find(
                sheet =>
                    sheet.properties.title ===
                    TEMPLATE_SHEET_NAME
            );


        if (!templateSheet) {

            throw new Error(
                `Template sheet "${TEMPLATE_SHEET_NAME}" tidak ditemukan.`
            );

        }


        const templateSheetId =
            templateSheet.properties.sheetId;


        // ========================================
        // DUPLICATE TEMPLATE
        // ========================================

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "AUTO CREATE SHEET"
        );

        console.log(
            "================================"
        );

        console.log(
            "Template :",
            TEMPLATE_SHEET_NAME
        );

        console.log(
            "Template ID :",
            templateSheetId
        );

        console.log(
            "New Sheet :",
            sheetName
        );


        const response =
            await sheets.spreadsheets.batchUpdate({

                spreadsheetId,

                requestBody: {

                    requests: [

                        {

                            duplicateSheet: {

                                sourceSheetId:
                                    templateSheetId,

                                newSheetName:
                                    sheetName

                            }

                        }

                    ]

                }

            });


        // ========================================
        // AMBIL SHEET HASIL DUPLICATE
        // ========================================

        const duplicatedSheet =
            response.data.replies?.[0]
                ?.duplicateSheet;


        const newSheetProperties =
            duplicatedSheet?.properties;


        console.log("");
        console.log(
            "Sheet berhasil dibuat."
        );

        console.log(
            "Sheet :",
            sheetName
        );

        console.log(
            "Sheet ID :",
            newSheetProperties?.sheetId
        );


        return {

            created: true,

            sheetName,

            sheetId:
                newSheetProperties?.sheetId

        };

    }

    catch (error) {

        console.error("");
        console.error(
            "================================"
        );

        console.error(
            "GAGAL AUTO CREATE SHEET"
        );

        console.error(
            "================================"
        );

        console.error(error.message);

        throw error;

    }

}

// ========================================
// EXPORT
// ========================================

module.exports = {

    getSheetData,

    updateRange,

    saveRowData,

    saveShiftData,

    saveExaminerName,

    ensureSheetExists

};