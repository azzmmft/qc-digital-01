const {
    validateRow
} = require("./utils/qcValidator");


console.log("=== LM NORMAL ===");

console.log(
    validateRow("LM", {
        AA: 215,
        OT: 9,
        BBT: 8,
        N2: 0.5
    })
);


console.log("=== LM AA TIDAK SESUAI ===");

console.log(
    validateRow("LM", {
        AA: 190,
        OT: 9,
        BBT: 8,
        N2: 0.5
    })
);


console.log("=== LM BBT/N2 KOSONG ===");

console.log(
    validateRow("LM", {
        AA: 215,
        OT: 9,
        BBT: null,
        N2: null
    })
);


console.log("=== TPH ===");

console.log(
    validateRow("TPH", {
        AA: 310,
        OT: 9,
        BBT: null,
        N2: null
    })
);