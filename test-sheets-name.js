const {
    generateSheetName
} = require("./config/sheetName");

console.log(
    generateSheetName("2026-01-03", 10)
);

console.log(
    generateSheetName("2026-01-03", 3)
);

console.log(
    generateSheetName("2026-01-04", 1)
);