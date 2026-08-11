const sheets = require("../config/googleSheets");

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const {
    getDataRange,
    getShiftDataRange
} = require("../config/sheetMapping");
// READ
async function getSheetData(sheetName) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetName
        });

        return response.data.values || [];

    } catch (error) {
        console.error(`Gagal membaca sheet ${sheetName}:`);
        console.error(error.message);
        throw error;
    }
}


// WRITE / UPDATE
async function updateRange(sheetName, range, values) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!${range}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values
            }
        });

        return true;

    } catch (error) {
        console.error(`Gagal menulis ke sheet ${sheetName}:`);
        console.error(error.message);
        throw error;
    }
}

async function saveRowData(sheetName, shift, row, values) {
    const range = getDataRange(shift, row);

    await updateRange(
        sheetName,
        range,
        [[
            values.AA,
            values.OT,
            values.BBT,
            values.N2
        ]]
    );

    return {
        sheetName,
        shift,
        row,
        range
    };
}
async function saveShiftData(sheetName, shift, rows) {

    if (![1, 2, 3].includes(Number(shift))) {
        throw new Error("Shift harus bernilai 1, 2, atau 3.");
    }

    if (!Array.isArray(rows)) {
        throw new Error("Data rows harus berupa array.");
    }

    if (rows.length !== 24) {
        throw new Error(
            `Jumlah row harus 24. Diterima: ${rows.length}`
        );
    }

    const values = rows.map((item, index) => {

        const expectedRow = index + 1;

        if (Number(item.row) !== expectedRow) {
            throw new Error(
                `Urutan row tidak sesuai. ` +
                `Expected: ${expectedRow}, ` +
                `Received: ${item.row}`
            );
        }

        return [
            item.AA ?? "",
            item.OT ?? "",
            item.BBT ?? "",
            item.N2 ?? ""
        ];
    });

    const range = getShiftDataRange(Number(shift));

    await updateRange(
        sheetName,
        range,
        values
    );

    return {
        sheetName,
        shift: Number(shift),
        rowsSaved: rows.length,
        range
    };
}
module.exports = {
    getSheetData,
    updateRange,
    saveRowData,
    saveShiftData
};