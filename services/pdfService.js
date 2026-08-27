const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// ========================================
// KONFIGURASI PDF
// ========================================

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;

const MARGIN_LEFT = 35;
const MARGIN_RIGHT = 35;
const MARGIN_TOP = 30;
const MARGIN_BOTTOM = 30;

const CONTENT_WIDTH =
    PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;


// ========================================
// ASSET
// ========================================

// Font Times New Roman
const FONT_REGULAR = path.join(
    __dirname,
    "../assets/fonts/times-new-roman.ttf"
);

const FONT_BOLD = path.join(
    __dirname,
    "../assets/fonts/times-new-roman-bold.ttf"
);

const FONT_ITALIC = path.join(
    __dirname,
    "../assets/fonts/times-new-roman-italic.ttf"
);


// Logo Mayora
const MAYORA_LOGO = path.join(
    __dirname,
    "../assets/images/logo-mayora.png"
);


// ========================================
// FONT FALLBACK
// ========================================

function getFontRegular() {
    return fs.existsSync(FONT_REGULAR)
        ? FONT_REGULAR
        : "Times-Roman";
}

function getFontBold() {
    return fs.existsSync(FONT_BOLD)
        ? FONT_BOLD
        : "Times-Bold";
}

function getFontItalic() {
    return fs.existsSync(FONT_ITALIC)
        ? FONT_ITALIC
        : "Times-Italic";
}


// ========================================
// HELPER
// ========================================

function formatValue(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value);
}


// ========================================
// FORMAT NAMA PRODUK
// ========================================

function formatProduct(product) {

    const normalized =
        String(product || "")
            .trim()
            .toUpperCase();

    if (
        normalized === "LM" ||
        normalized === "LEM" ||
        normalized === "LE MINERALE"
    ) {
        return "Le Minerale";
    }

    if (
        normalized === "TPH" ||
        normalized === "TP" ||
        normalized === "TEH PUCUK HARUM"
    ) {
        return "Teh Pucuk Harum";
    }

    return formatValue(product);
}


// ========================================
// DRAW CELL
// ========================================

function drawCell(
    doc,
    x,
    y,
    width,
    height,
    text,
    {
        font = getFontRegular(),
        fontSize = 8,
        align = "center",
        valign = "middle",
        border = true,
        padding = 3,
        color = "black"
    } = {}
) {

    if (border) {

        doc
            .rect(
                x,
                y,
                width,
                height
            )
            .stroke();
    }


    if (
        text === undefined ||
        text === null
    ) {
        return;
    }


    doc
        .font(font)
        .fontSize(fontSize)
        .fillColor(color);


    // ========================================
    // POSISI TEXT VERTICAL
    // ========================================

    let textY =
        y + padding;


    if (valign === "middle") {

        // Hitung tinggi teks yang sebenarnya
        // agar benar-benar berada di tengah cell
        const textHeight =
            doc.heightOfString(
                formatValue(text),
                {
                    width:
                        width -
                        padding * 2,

                    align,

                    lineGap: 0
                }
            );

        textY =
            y +
            (
                height -
                textHeight
            ) / 2;
    }


    doc.text(
        formatValue(text),
        x + padding,
        textY,
        {
            width:
                width -
                padding * 2,

            align,

            lineGap: 0
        }
    );

}


// ========================================
// KONVERSI ANGKA
// ========================================

function toNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }


    const normalized =
        String(value)
            .replace(",", ".")
            .trim();


    const num =
        parseFloat(normalized);


    return isNaN(num)
        ? null
        : num;
}


// ========================================
// CEK OUTSPEC
// ========================================

function isOutspec(
    product,
    field,
    value
) {

    const num =
        toNumber(value);

    // Kalau kosong / bukan angka
    // jangan dianggap OUTSPEC
    if (num === null) {
        return false;
    }


    // ========================================
    // TPH
    // ========================================

    if (product === "TPH") {

        if (field === "AA") {
            return num < 320 || num > 370;
        }

        if (field === "OT") {
            return num < 8 || num > 11;
        }

        return false;
    }


    // ========================================
    // LM
    // ========================================

    if (product === "LM") {

        if (field === "AA") {
            return num < 200 || num > 230;
        }

        if (field === "OT") {
            return num < 7 || num > 13;
        }

        if (field === "BBT") {
            return num < 6 || num > 12;
        }

        if (field === "N2") {
            return num < 0.4 || num > 0.6;
        }

    }


    return false;

}


// ========================================
// STATISTIK
// ========================================

function calcColumnStats(
    existingData,
    shift,
    field
) {

    const numbers = [];


    for (
        let rowNumber = 1;
        rowNumber <= 24;
        rowNumber++
    ) {

        const rowData =
            existingData?.[
                String(shift)
            ]?.[
                String(rowNumber)
            ] || {};


        const num =
            toNumber(
                rowData[field]
            );


        if (num !== null) {

            numbers.push(num);

        }

    }


    if (
        numbers.length === 0
    ) {

        return {
            average: "",
            max: "",
            min: ""
        };

    }


    const sum =
        numbers.reduce(
            (a, b) => a + b,
            0
        );


    return {

        average:
            (
                sum /
                numbers.length
            ).toFixed(2),

        max:
            Math.max(...numbers),

        min:
            Math.min(...numbers)

    };

}


// ========================================
// KOP FORMULIR
// ========================================

function drawKopHeader(doc) {

    const x = MARGIN_LEFT;
    const y = MARGIN_TOP;

    const totalWidth =
        CONTENT_WIDTH;


    // ----------------------------------------
    // LEBAR KOLOM
    // ----------------------------------------

    const col1Width = 130;

    const col3Width = 165;

    const col2Width =
        totalWidth -
        col1Width -
        col3Width;


    // ----------------------------------------
    // TINGGI
    // ----------------------------------------

    const row1Height = 75;

    const row2Height = 45;

    const totalHeight =
        row1Height +
        row2Height;


    const col1X = x;

    const col2X =
        col1X +
        col1Width;

    const col3X =
        col2X +
        col2Width;


    // ----------------------------------------
    // OUTER BORDER
    // ----------------------------------------

    doc
        .rect(
            x,
            y,
            totalWidth,
            totalHeight
        )
        .lineWidth(1)
        .stroke();


    // ----------------------------------------
    // VERTICAL
    // ----------------------------------------

    doc
        .moveTo(
            col2X,
            y
        )
        .lineTo(
            col2X,
            y + totalHeight
        )
        .stroke();


    doc
        .moveTo(
            col3X,
            y
        )
        .lineTo(
            col3X,
            y + totalHeight
        )
        .stroke();


    // ----------------------------------------
    // HORIZONTAL KOLOM 1 & 2
    // ----------------------------------------

    doc
        .moveTo(
            col1X,
            y + row1Height
        )
        .lineTo(
            col3X,
            y + row1Height
        )
        .stroke();


    // ========================================
    // LOGO MAYORA
    // ========================================

    if (
        fs.existsSync(MAYORA_LOGO)
    ) {

        try {

            doc.image(
                MAYORA_LOGO,
                col1X + 30,
                y + 8,
                {
                    fit: [
                        col1Width - 60,
                        42
                    ],
                    align: "center",
                    valign: "center"
                }
            );

        } catch (error) {

            console.error(
                "Gagal membaca logo Mayora:",
                error.message
            );

        }

    }


    // ========================================
    // MAYORA GROUP TEXT
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(7)
        .text(
            "MAYORA GROUP",
            col1X,
            y + 53,
            {
                width: col1Width,
                align: "center"
            }
        );


    // ========================================
    // DEPT QUALITY CONTROL
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(7)
        .text(
            "Dept. Quality",
            col1X,
            y + row1Height + 11,
            {
                width: col1Width,
                align: "center"
            }
        );


    doc.text(
        "Control",
        col1X,
        y + row1Height + 22,
        {
            width: col1Width,
            align: "center"
        }
    );


    // ========================================
    // NAMA PERUSAHAAN
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(15)
        .text(
            "PT. TIRTA FRESINDO JAYA",
            col2X,
            y + 19,
            {
                width: col2Width,
                align: "center"
            }
        );


    doc
        .font(getFontBold())
        .fontSize(14)
        .text(
            "PLANT PASURUAN",
            col2X,
            y + 41,
            {
                width: col2Width,
                align: "center"
            }
        );


    // ========================================
    // FORMULIR
    // ========================================

    doc
        .font(getFontRegular())
        .fontSize(9)
        .text(
            "Formulir",
            col2X,
            y + row1Height + 5,
            {
                width: col2Width,
                align: "center"
            }
        );


    // ========================================
    // JUDUL
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(12)
        .text(
            "ANALISA OPEN TORQUE",
            col2X,
            y + row1Height + 18,
            {
                width: col2Width,
                align: "center"
            }
        );


    // ========================================
    // NO KODE DOK
    // ========================================

    doc
        .font(getFontRegular())
        .fontSize(7)
        .text(
            "No. Kode Dok. :",
            col3X + 6,
            y + 12,
            {
                width:
                    col3Width - 12
            }
        );


    doc.text(
        "MAY/PRC/PRO/BEV/TP5/QC&LNP/12/005-08-2",
        col3X + 6,
        y + 25,
        {
            width:
                col3Width - 12
        }
    );


    // ========================================
    // PEMISAH NO / HALAMAN
    // ========================================

    const subRowHeight =
        row2Height / 2;


    doc
        .moveTo(
            col3X,
            y +
                row1Height +
                subRowHeight
        )
        .lineTo(
            col3X + col3Width,
            y +
                row1Height +
                subRowHeight
        )
        .stroke();


    // ========================================
    // NO
    // ========================================

    doc
        .font(getFontRegular())
        .fontSize(7)
        .text(
            "No.             :",
            col3X + 6,
            y + row1Height + 8,
            {
                width:
                    col3Width - 12
            }
        );


    // ========================================
    // HALAMAN
    // ========================================

    doc.text(
        "Halaman     :   1   dari   1",
        col3X + 6,
        y +
            row1Height +
            subRowHeight +
            8,
        {
            width:
                col3Width - 12
        }
    );


    return y + totalHeight;

}


// ========================================
// INFORMASI PRODUK
// ========================================

function drawProductInfo(
    doc,
    y,
    {
        date,
        line,
        product
    }
) {

    const x =
        MARGIN_LEFT;


    const productName =
        formatProduct(product);


    // ========================================
    // PRODUK
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(11)
        .text(
            "Produk :",
            x,
            y + 12
        );


    doc
        .moveTo(
            x + 45,
            y + 22
        )
        .lineTo(
            x + 300,
            y + 22
        )
        .stroke();


    doc
        .font(getFontRegular())
        .fontSize(13)
        .text(
            productName,
            x + 50,
            y + 11
        );


    // ========================================
    // BERLAKU
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(9)
        .text(
            "BERLAKU : 01 SEPT 2025",
            PAGE_WIDTH -
                MARGIN_RIGHT -
                180,
            y + 12,
            {
                width: 180,
                align: "right"
            }
        );


    // ========================================
    // TANGGAL PRODUKSI / LINE
    // ========================================

    doc
        .font(getFontBold())
        .fontSize(11)
        .text(
            "Tanggal Produksi / Line :",
            x,
            y + 32
        );


    doc
        .moveTo(
            x + 140,
            y + 42
        )
        .lineTo(
            x + 380,
            y + 42
        )
        .stroke();


    doc
        .font(getFontRegular())
        .fontSize(12)
        .text(
            [
                date,
                line
            ]
                .filter(Boolean)
                .join(" / "),
            x + 145,
            y + 31
        );


    return y + 55;

}


// ========================================
// TABEL UTAMA
// ========================================

const TABLE_ROW_HEIGHT = 16;

const TABLE_HEADER_ROW_HEIGHT = 19;

const NO_COL_WIDTH = 42;

const SUB_HEADERS = [
    "AA",
    "OT",
    "BBT*",
    "N2**"
];

const SUB_FIELDS = [
    "AA",
    "OT",
    "BBT",
    "N2"
];


function getSubColWidth() {

    return (
        (
            CONTENT_WIDTH -
            NO_COL_WIDTH
        ) / 12
    );

}


// ========================================
// HEADER TABEL
// ========================================

function drawMainTableHeader(
    doc,
    x,
    y
) {

    const subColWidth =
        getSubColWidth();


    const dataWidth =
        CONTENT_WIDTH -
        NO_COL_WIDTH;


    const totalHeaderHeight =
        TABLE_HEADER_ROW_HEIGHT * 3;


    // ========================================
    // NO
    // ========================================

    drawCell(
        doc,
        x,
        y,
        NO_COL_WIDTH,
        totalHeaderHeight,
        "No.",
        {
            font: getFontBold(),
            fontSize: 10,
            align: "center",
            valign: "middle"
        }
    );


    // ========================================
    // OPEN TORQUE
    // ========================================

    drawCell(
        doc,
        x + NO_COL_WIDTH,
        y,
        dataWidth,
        TABLE_HEADER_ROW_HEIGHT,
        "Open Torque (lbf.inch)",
        {
            font: getFontBold(),
            fontSize: 10,
            align: "center",
            valign: "middle"
        }
    );


    // ========================================
    // SHIFT 1-3
    // ========================================

    const shiftWidth =
        subColWidth * 4;


    for (
        let s = 0;
        s < 3;
        s++
    ) {

        drawCell(
            doc,
            x +
                NO_COL_WIDTH +
                s * shiftWidth,

            y +
                TABLE_HEADER_ROW_HEIGHT,

            shiftWidth,

            TABLE_HEADER_ROW_HEIGHT,

            `Shift ${s + 1}`,

            {
                font: getFontBold(),
                fontSize: 10,
                align: "center",
                valign: "middle"
            }
        );

    }


    // ========================================
    // SUB HEADER
    // ========================================

    for (
        let s = 0;
        s < 3;
        s++
    ) {

        for (
            let c = 0;
            c < 4;
            c++
        ) {

            const cellX =
                x +
                NO_COL_WIDTH +
                s * shiftWidth +
                c * subColWidth;


            drawCell(
                doc,
                cellX,

                y +
                    TABLE_HEADER_ROW_HEIGHT * 2,

                subColWidth,

                TABLE_HEADER_ROW_HEIGHT,

                SUB_HEADERS[c],

                {
                    font: getFontBold(),
                    fontSize: 10,
                    align: "center",
                    valign: "middle"
                }
            );

        }

    }


    return totalHeaderHeight;

}


// ========================================
// DATA ROW
// ========================================

function drawMainTableDataRow(
    doc,
    x,
    y,
    label,
    getValueForShiftField,
    product
) {

    const subColWidth =
        getSubColWidth();


    // ========================================
    // NO / LABEL
    // ========================================

    drawCell(
        doc,
        x,
        y,
        NO_COL_WIDTH,
        TABLE_ROW_HEIGHT,
        label,
        {
            font: getFontRegular(),
            fontSize: 10,
            align: "center",
            valign: "middle"
        }
    );


    // ========================================
    // SHIFT
    // ========================================

    for (
        let s = 1;
        s <= 3;
        s++
    ) {

        for (
            let c = 0;
            c < 4;
            c++
        ) {

            const cellX =
                x +
                NO_COL_WIDTH +
                (s - 1) *
                    subColWidth *
                    4 +
                c *
                    subColWidth;


            const value =
                getValueForShiftField(
                    s,
                    SUB_FIELDS[c]
                );


            drawCell(
                doc,
                cellX,
                y,
                subColWidth,
                TABLE_ROW_HEIGHT,
                value,
                {
                    font:
                        getFontRegular(),

                    fontSize: 10,

                    align: "center",

                    valign: "middle",

                    color:
                        isOutspec(
                            product,
                            SUB_FIELDS[c],
                            value
                        )
                            ? "red"
                            : "black"
                }
            );

        }

    }

}


// ========================================
// MAIN TABLE
// ========================================

function drawMainTable(
    doc,
    x,
    y,
    existingData,
    product
) {

    let currentY = y;


    // ========================================
    // HEADER
    // ========================================

    currentY +=
        drawMainTableHeader(
            doc,
            x,
            currentY
        );


    // ========================================
    // 24 ROW
    // ========================================

    for (
        let rowNumber = 1;
        rowNumber <= 24;
        rowNumber++
    ) {

        drawMainTableDataRow(
            doc,
            x,
            currentY,
            String(rowNumber),

            (shift, field) => {

                const rowData =
                    existingData?.[
                        String(shift)
                    ]?.[
                        String(rowNumber)
                    ] || {};


                return rowData[field];

            },

            product
        );


        currentY +=
            TABLE_ROW_HEIGHT;

    }


    // ========================================
    // SUMMARY
    // ========================================

    const summaryRows = [

        {
            label: "Average",
            key: "average"
        },

        {
            label: "Max",
            key: "max"
        },

        {
            label: "Min",
            key: "min"
        }

    ];


    summaryRows.forEach(
        ({
            label,
            key
        }) => {

            drawMainTableDataRow(
                doc,
                x,
                currentY,
                label,

                (shift, field) => {

                    const stats =
                        calcColumnStats(
                            existingData,
                            shift,
                            field
                        );


                    return stats[key];

                },

                product
            );


            currentY +=
                TABLE_ROW_HEIGHT;

        }
    );


    return currentY;

}


// ========================================
// FOOTER
// ========================================

function drawFooter(
    doc,
    y,
    existingData
) {

    const x =
        MARGIN_LEFT;


    // ========================================
    // NAMA PEMERIKSA PER SHIFT
    // ========================================

    function getExaminerName(shift) {

        const shiftData =
            existingData?.[String(shift)] || {};

        for (
            const rowNumber of Object.keys(shiftData)
        ) {

            const name =
                shiftData[rowNumber]?.examinerName;

            if (
                name &&
                String(name).trim() !== ""
            ) {

                return String(name).trim();

            }

        }

        return "";

    }


    // ========================================
    // NOTES
    // ========================================

    doc
        .font(getFontItalic())
        .fontSize(7.5);


    doc.text(
        "Notes :   * : Untuk pengecekan semua SKU kecuali TPH 350 ml",
        x,
        y + 5
    );


    doc.text(
        "               ** : Untuk pengecekan AMDK",
        x,
        y + 17
    );


    // ========================================
    // TABEL SIGNATURE
    // ========================================

    const sigSubColWidth = 62;

    const qcLineWidth =
        sigSubColWidth * 3;

    const diperiksaWidth = 95;

    const sigTableWidth =
        qcLineWidth +
        diperiksaWidth;


    const sigX =
        PAGE_WIDTH -
        MARGIN_RIGHT -
        sigTableWidth;


    const headerRowHeight = 16;

    const signSpaceHeight = 40;

    const subHeaderRowHeight = 16;


    let sigY = y;


    // ========================================
    // HEADER QC LINE
    // ========================================

    drawCell(
        doc,
        sigX,
        sigY,
        qcLineWidth,
        headerRowHeight,
        "QC Line",
        {
            font: getFontBold(),
            fontSize: 8,
            align: "center",
            valign: "middle"
        }
    );


    drawCell(
        doc,
        sigX + qcLineWidth,
        sigY,
        diperiksaWidth,
        headerRowHeight,
        "Diperiksa Oleh,",
        {
            font: getFontBold(),
            fontSize: 8,
            align: "center",
            valign: "middle"
        }
    );


    sigY +=
        headerRowHeight;


    // ========================================
    // RUANG TTD
    // ========================================
    //
    // PENTING:
    // Dibuat 3 CELL TERPISAH.
    //
    // Shift 1 | Shift 2 | Shift 3
    //
    // BUKAN satu cell besar.
    // ========================================

    for (
        let index = 0;
        index < 3;
        index++
    ) {

        const shift =
            index + 1;

        const examinerName =
            getExaminerName(shift);

        drawCell(
            doc,

            sigX +
                index *
                sigSubColWidth,

            sigY,

            sigSubColWidth,

            signSpaceHeight,

            examinerName,

            {
                border: true,
                font: getFontRegular(),
                fontSize: 9,
                align: "center",
                valign: "middle"
            }
        );

    }


    // Diperiksa Oleh
    drawCell(
        doc,
        sigX + qcLineWidth,
        sigY,
        diperiksaWidth,
        signSpaceHeight,
        "",
        {
            border: true
        }
    );


    sigY +=
        signSpaceHeight;


    // ========================================
    // LABEL SHIFT
    // ========================================

    [
        "Shift 1",
        "Shift 2",
        "Shift 3"
    ].forEach(
        (
            label,
            index
        ) => {

            drawCell(
                doc,

                sigX +
                    index *
                    sigSubColWidth,

                sigY,

                sigSubColWidth,

                subHeaderRowHeight,

                label,

                {
                    font:
                        getFontBold(),

                    fontSize: 9,

                    align: "center",

                    valign: "middle"
                }
            );

        }
    );


    // ========================================
    // UH / SH QC
    // ========================================

    drawCell(
        doc,
        sigX + qcLineWidth,
        sigY,
        diperiksaWidth,
        subHeaderRowHeight,
        "UH/SH QC",
        {
            font: getFontBold(),
            fontSize: 8,
            align: "center",
            valign: "middle"
        }
    );


    sigY +=
        subHeaderRowHeight;


    return sigY;

}


// ========================================
// CREATE QC PDF
// ========================================

function createQCPDF(
    res,
    {
        date,
        line,
        product,
        existingData
    }
) {

    const doc =
        new PDFDocument({
            size: "A4",
            margin: 0
        });


    // ========================================
    // FILE NAME
    // ========================================

    const safeDate =
        String(date || "QC")
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            );


    const safeLine =
        String(line || "line")
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            );


    // ========================================
    // RESPONSE
    // ========================================

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );


    res.setHeader(
        "Content-Disposition",
        `attachment; filename="QC-${safeDate}-L${safeLine}.pdf"`
    );


    doc.pipe(res);


    // ========================================
    // HEADER
    // ========================================

    let y =
        drawKopHeader(doc);


    // ========================================
    // PRODUCT INFO
    // ========================================

    y =
        drawProductInfo(
            doc,
            y,
            {
                date,
                line,
                product
            }
        );


    // ========================================
    // MAIN TABLE
    // ========================================

    y =
        drawMainTable(
            doc,
            MARGIN_LEFT,
            y,
            existingData,
            product
        );


    // ========================================
    // FOOTER
    // ========================================

    drawFooter(
        doc,
        y + 10,
        existingData
    );


    // ========================================
    // END
    // ========================================

    doc.end();

}


// ========================================
// EXPORT
// ========================================

module.exports = {
    createQCPDF
};