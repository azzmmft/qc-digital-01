const sheets = require("../config/googleSheets");

const spreadsheetId =
    process.env.GOOGLE_SPREADSHEET_ID;

const {
    getDataRange,
    getShiftDataRange
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


    if (rows.length !== 24) {

        throw new Error(
            `Jumlah row harus 24. Diterima: ${rows.length}`
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
    // BENTUK DATA UNTUK GOOGLE SHEETS
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

        product,

        rowsSaved:
            rows.length,

        range

    };

}


// ========================================
// EXPORT
// ========================================

module.exports = {

    getSheetData,

    updateRange,

    saveRowData,

    saveShiftData

};