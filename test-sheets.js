require("dotenv").config();

const {
    getSheetData,
    updateRange,
    saveRowData,
    saveShiftData
} = require("./services/googleSheetsService");

async function main() {

    try {

        // TEST READ
        const data = await getSheetData("2026-01-03_L10");

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

        // TEST UPDATE
        await updateRange(
            "Sheet2",
            "A2:D2",
            [
                [1, 1, 215, 9]
            ]
        );

        await updateRange(
            "Sheet2",
            "C2:D2",
            [
                [220, 10]
            ]
        );

        console.log("=== UPDATE BERHASIL ===");

        // TEST STANDARD
        const QC_STANDARDS = require("./config/qcStandards");

        console.log("=== QC STANDARDS ===");
        console.log(QC_STANDARDS);

        // TEST SAVE ROW
        const result = await saveRowData(
            "2026-01-03_L10",
            1,
            1,
            {
                AA: 215,
                OT: 9,
                BBT: 8,
                N2: 0.5
            }
        );

        console.log("=== SAVE ROW BERHASIL ===");
        console.log(result);

        const testRows = Array.from({ length: 24 }, (_, index) => ({
            row: index + 1,
            AA: 200 + index,
            OT: 8 + (index % 4),
            BBT: 6 + (index % 7),
            N2: 0.4 + ((index % 3) * 0.1)
        }));

        const shiftResult = await saveShiftData(
            "2026-01-03_L10",
            3,
            testRows
        );

        console.log("=== SAVE SHIFT BERHASIL ===");

    } catch (error) {

        console.error("Testing gagal.");
    }
}

main();