const SHEET_MAPPING = {
    header: {
        date: "B1",
        line: "B2",
        product: "B3",
        status: "B4"
    },

    table: {
        startRow: 7,
        rowsPerShift: 24,

        columns: {
            shift: "A",
            row: "B",
            AA: "C",
            OT: "D",
            BBT: "E",
            N2: "F"
        }
    }
};


/**
 * Mengubah Shift + nomor row form
 * menjadi nomor row di Google Sheets.
 *
 * Contoh:
 * Shift 1, Row 1 → 7
 * Shift 1, Row 24 → 30
 * Shift 2, Row 1 → 31
 * Shift 3, Row 24 → 78
 */
function getSheetRow(shift, row) {
    const { startRow, rowsPerShift } = SHEET_MAPPING.table;

    return startRow + ((shift - 1) * rowsPerShift) + (row - 1);
}


/**
 * Menghasilkan range cell untuk data AA sampai N2.
 *
 * Contoh:
 * Shift 2, Row 7 → C37:F37
 */
function getDataRange(shift, row) {
    const sheetRow = getSheetRow(shift, row);

    return `C${sheetRow}:F${sheetRow}`;
}

function getShiftDataRange(shift) {
    const { startRow, rowsPerShift } = SHEET_MAPPING.table;

    const firstRow = startRow + ((shift - 1) * rowsPerShift);
    const lastRow = firstRow + rowsPerShift - 1;

    return `C${firstRow}:F${lastRow}`;
}

module.exports = {
    SHEET_MAPPING,
    getSheetRow,
    getDataRange,
    getShiftDataRange
};