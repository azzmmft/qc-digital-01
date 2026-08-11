const {
    getSheetRow,
    getDataRange
} = require("./config/sheetMapping");


console.log("Shift 1 Row 1:");
console.log(getSheetRow(1, 1));

console.log("Shift 1 Row 24:");
console.log(getSheetRow(1, 24));

console.log("Shift 2 Row 1:");
console.log(getSheetRow(2, 1));

console.log("Shift 2 Row 24:");
console.log(getSheetRow(2, 24));

console.log("Shift 3 Row 1:");
console.log(getSheetRow(3, 1));

console.log("Shift 3 Row 24:");
console.log(getSheetRow(3, 24));


console.log("\nRange test:");

console.log("Shift 1 Row 1:");
console.log(getDataRange(1, 1));

console.log("Shift 2 Row 7:");
console.log(getDataRange(2, 7));

console.log("Shift 3 Row 24:");
console.log(getDataRange(3, 24));

const {
    getShiftDataRange
} = require("./config/sheetMapping");

console.log("\nShift range:");

console.log("Shift 1:");
console.log(getShiftDataRange(1));

console.log("Shift 2:");
console.log(getShiftDataRange(2));

console.log("Shift 3:");
console.log(getShiftDataRange(3));