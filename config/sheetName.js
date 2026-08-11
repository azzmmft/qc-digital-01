function generateSheetName(date, line) {
    return `${date}_L${line}`;
}

module.exports = {
    generateSheetName
};