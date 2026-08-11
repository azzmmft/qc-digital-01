require("dotenv").config();

const {
    getSheetData,
    updateRange
} = require("./services/googleSheetsService");

async function main() {
    try {

        // TEST READ
        const data = await getSheetData("2026-01-03_L1");

        console.log("=== DATA SHEET ===");
        console.log(data);


        // TEST WRITE
        await updateRange(
            "Sheet2",
            "A1:D1",
            [
                ["SHIFT", "ROW", "AA", "OT"]
            ]
        );

        console.log("=== WRITE BERHASIL ===");

    } catch (error) {
        console.error("Testing gagal.");
    }
}

main();