const SHEET_MAPPING = {
    header: {
        date: "B1",
        line: "B2",
        product: "B3",
        status: "B4"
    },

    // ========================================
    // KOLOM PEMERIKSA
    // ========================================

    examiner: "G",

    table: {
        startRow: 7,
        rowsPerShift: 24,

        columns: {
            shift: "A",
            row: "B",
            AA: "C",
            OT: "D",
            BBT: "E",
            N2: "F",
            examiner: "G"
        }
    }
};


/**
 * Mengubah Shift + nomor row form
 * menjadi nomor row di Google Sheets.
 *
 * Shift 1, Row 1  → 7
 * Shift 1, Row 24 → 30
 * Shift 2, Row 1  → 31
 * Shift 3, Row 24 → 78
 */
function getSheetRow(shift, row) {

    const {
        startRow,
        rowsPerShift
    } = SHEET_MAPPING.table;

    return (
        startRow +
        ((Number(shift) - 1) * rowsPerShift) +
        (Number(row) - 1)
    );
}


/**
 * Menghasilkan range cell untuk
 * data QC AA sampai N2 / AA* sampai OT*.
 *
 * Contoh:
 * Shift 2, Row 1 → C31:F31
 */
function getDataRange(shift, row) {

    const sheetRow =
        getSheetRow(shift, row);

    return `C${sheetRow}:F${sheetRow}`;
}


/**
 * Menghasilkan range seluruh data
 * dalam satu shift.
 *
 * Shift 1 → C7:F30
 * Shift 2 → C31:F54
 * Shift 3 → C55:F78
 */
function getShiftDataRange(shift) {

    const {
        startRow,
        rowsPerShift
    } = SHEET_MAPPING.table;

    const firstRow =
        startRow +
        ((Number(shift) - 1) * rowsPerShift);

    const lastRow =
        firstRow +
        rowsPerShift -
        1;

    return `C${firstRow}:F${lastRow}`;
}


/**
 * Menghasilkan range kolom pemeriksa
 * untuk satu shift.
 *
 * Shift 1 → G7:G30
 * Shift 2 → G31:G54
 * Shift 3 → G55:G78
 */
function getExaminerRange(shift) {

    const {
        startRow,
        rowsPerShift
    } = SHEET_MAPPING.table;

    const firstRow =
        startRow +
        ((Number(shift) - 1) * rowsPerShift);

    const lastRow =
        firstRow +
        rowsPerShift -
        1;

    return `G${firstRow}:G${lastRow}`;
}


module.exports = {
    SHEET_MAPPING,
    getSheetRow,
    getDataRange,
    getShiftDataRange,
    getExaminerRange
};