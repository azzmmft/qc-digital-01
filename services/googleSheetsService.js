const sheets = require("../config/googleSheets");

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

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

module.exports = {
    getSheetData
};

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

module.exports = {
    getSheetData,
    updateRange
};