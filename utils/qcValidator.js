const QC_STANDARDS = require("../config/qcStandards");


function isWithinRange(value, standard) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return false;
    }

    return number >= standard.min && number <= standard.max;
}


function validateField(product, field, value) {
    const standard = QC_STANDARDS[product]?.[field];

    // Jika field tidak mempunyai standard,
    // jangan dianggap error.
    if (!standard) {
        return null;
    }

    return isWithinRange(value, standard);
}


function validateRow(product, values) {
    return {
        AA: validateField(product, "AA", values.AA),
        OT: validateField(product, "OT", values.OT),
        BBT: validateField(product, "BBT", values.BBT),
        N2: validateField(product, "N2", values.N2)
    };
}


module.exports = {
    isWithinRange,
    validateField,
    validateRow
};