// config/shiftSchedule.js

/**
 * ============================================
 * SHIFT SCHEDULE - QC DIGITAL
 * ============================================
 *
 * Timezone:
 * Asia/Jakarta (WIB)
 *
 * Shift:
 * Shift 1 = 06:00 - 14:00
 * Shift 2 = 14:00 - 22:00
 * Shift 3 = 22:00 - 06:00
 *
 * Catatan:
 * Shift 3 melewati tengah malam.
 * Contoh:
 * Production Date 17 September
 * Shift 3 = 17 September 22:00
 *            sampai 18 September 06:00
 */

const TIMEZONE = "Asia/Jakarta";

const SHIFT_SCHEDULE = {
    1: {
        name: "Shift 1",
        startHour: 6,
        startMinute: 0,
        endHour: 14,
        endMinute: 0
    },

    2: {
        name: "Shift 2",
        startHour: 14,
        startMinute: 0,
        endHour: 22,
        endMinute: 0
    },

    3: {
        name: "Shift 3",
        startHour: 22,
        startMinute: 0,
        endHour: 6,
        endMinute: 0
    }
};


/**
 * Mendapatkan komponen tanggal & waktu sekarang
 * berdasarkan timezone Asia/Jakarta.
 */
function getJakartaDateParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });

    const parts = formatter.formatToParts(date);

    const result = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            result[part.type] = Number(part.value);
        }
    }

    return {
        year: result.year,
        month: result.month,
        day: result.day,
        hour: result.hour,
        minute: result.minute,
        second: result.second
    };
}


/**
 * Membuat representasi waktu "wall clock"
 * menggunakan UTC sebagai media perhitungan kalender.
 *
 * Ini BUKAN waktu UTC sebenarnya.
 * Date.UTC hanya digunakan supaya perhitungan
 * tanggal tidak bergantung pada timezone server.
 */
function createWallClockDate(year, month, day, hour, minute, second = 0) {
    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute,
            second
        )
    );
}


/**
 * Mengubah tanggal YYYY-MM-DD menjadi
 * komponen tanggal.
 */
function parseProductionDate(productionDate) {
    if (!productionDate) {
        return null;
    }

    const match = String(productionDate).match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3])
    };
}


/**
 * Format tanggal menjadi YYYY-MM-DD.
 */
function formatDate(year, month, day) {
    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}


/**
 * Menambahkan satu hari ke tanggal.
 */
function addOneDay(year, month, day) {
    const date = createWallClockDate(
        year,
        month,
        day,
        0,
        0,
        0
    );

    date.setUTCDate(date.getUTCDate() + 1);

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate()
    };
}


/**
 * Mendapatkan periode shift berdasarkan
 * production date.
 */
function getShiftPeriod(productionDate, shift) {
    const parsedDate = parseProductionDate(productionDate);
    const schedule = SHIFT_SCHEDULE[shift];

    if (!parsedDate || !schedule) {
        return null;
    }

    const start = createWallClockDate(
        parsedDate.year,
        parsedDate.month,
        parsedDate.day,
        schedule.startHour,
        schedule.startMinute,
        0
    );

    let endYear = parsedDate.year;
    let endMonth = parsedDate.month;
    let endDay = parsedDate.day;

    // Shift 3 berakhir pada hari berikutnya.
    if (shift === 3) {
        const nextDay = addOneDay(
            parsedDate.year,
            parsedDate.month,
            parsedDate.day
        );

        endYear = nextDay.year;
        endMonth = nextDay.month;
        endDay = nextDay.day;
    }

    const end = createWallClockDate(
        endYear,
        endMonth,
        endDay,
        schedule.endHour,
        schedule.endMinute,
        0
    );

    return {
        shift,
        name: schedule.name,

        productionDate,

        start,
        end,

        startLabel:
            `${String(schedule.startHour).padStart(2, "0")}:` +
            `${String(schedule.startMinute).padStart(2, "0")}`,

        endLabel:
            `${String(schedule.endHour).padStart(2, "0")}:` +
            `${String(schedule.endMinute).padStart(2, "0")}`
    };
}


/**
 * Format waktu dari wall-clock Date.
 *
 * Karena getShiftPeriod menggunakan Date.UTC
 * sebagai representasi kalender, format menggunakan
 * UTC getter agar tidak terkena timezone server.
 */
function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "-";
    }

    return (
        String(date.getUTCHours()).padStart(2, "0") +
        ":" +
        String(date.getUTCMinutes()).padStart(2, "0")
    );
}


/**
 * Format durasi milliseconds menjadi:
 *
 * HH jam MM menit SS detik
 */
function formatDuration(milliseconds) {
    if (milliseconds <= 0) {
        return "00 jam 00 menit 00 detik";
    }

    const totalSeconds = Math.floor(
        milliseconds / 1000
    );

    const hours = Math.floor(
        totalSeconds / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds =
        totalSeconds % 60;

    return (
        `${String(hours).padStart(2, "0")} jam ` +
        `${String(minutes).padStart(2, "0")} menit ` +
        `${String(seconds).padStart(2, "0")} detik`
    );
}


/**
 * ============================================
 * GET SHIFT STATUS
 * ============================================
 *
 * Menghasilkan status:
 *
 * isActive
 * isEditable
 * isViewOnly
 *
 * serta waktu tersisa.
 */
function getShiftStatus(
    productionDate,
    shift,
    currentDateTime = new Date()
) {
    const parsedDate =
        parseProductionDate(productionDate);

    const schedule =
        SHIFT_SCHEDULE[shift];

    if (!parsedDate || !schedule) {
        return {
            isActive: false,
            isEditable: false,
            isViewOnly: true,
            remainingMs: 0,
            remainingSeconds: 0,
            remainingTime: "00 jam 00 menit 00 detik",
            shift,
            shiftName: schedule
                ? schedule.name
                : `Shift ${shift}`,
            productionDate,
            timezone: TIMEZONE
        };
    }

    const now =
        getJakartaDateParts(currentDateTime);

    const nowWallClock =
        createWallClockDate(
            now.year,
            now.month,
            now.day,
            now.hour,
            now.minute,
            now.second
        );

    const productionDateStart =
        createWallClockDate(
            parsedDate.year,
            parsedDate.month,
            parsedDate.day,
            0,
            0,
            0
        );

    const productionDateEnd =
        createWallClockDate(
            parsedDate.year,
            parsedDate.month,
            parsedDate.day,
            23,
            59,
            59
        );

    let start;
    let end;

    /**
     * SHIFT 1 & 2
     */
    if (shift === 1 || shift === 2) {
        start =
            createWallClockDate(
                parsedDate.year,
                parsedDate.month,
                parsedDate.day,
                schedule.startHour,
                schedule.startMinute,
                0
            );

        end =
            createWallClockDate(
                parsedDate.year,
                parsedDate.month,
                parsedDate.day,
                schedule.endHour,
                schedule.endMinute,
                0
            );
    }

    /**
     * SHIFT 3
     *
     * 17 Sep 22:00
     * →
     * 18 Sep 06:00
     */
    if (shift === 3) {
        start =
            createWallClockDate(
                parsedDate.year,
                parsedDate.month,
                parsedDate.day,
                22,
                0,
                0
            );

        const nextDay =
            addOneDay(
                parsedDate.year,
                parsedDate.month,
                parsedDate.day
            );

        end =
            createWallClockDate(
                nextDay.year,
                nextDay.month,
                nextDay.day,
                6,
                0,
                0
            );
    }

    const isActive =
        nowWallClock >= start &&
        nowWallClock < end;

    /**
     * Untuk Shift 1 & 2:
     * hanya production date yang sama
     * yang boleh diedit.
     */
    let isProductionDate = false;

    if (shift === 1 || shift === 2) {
        isProductionDate =
            now.year === parsedDate.year &&
            now.month === parsedDate.month &&
            now.day === parsedDate.day;
    }

    /**
     * Untuk Shift 3:
     *
     * 17 Sep 22:00 - 23:59
     * ATAU
     * 18 Sep 00:00 - 05:59
     *
     * tetap dianggap Shift 3
     * production date 17 Sep.
     */
    if (shift === 3) {
        const nextDay =
            addOneDay(
                parsedDate.year,
                parsedDate.month,
                parsedDate.day
            );

        const isStartDate =
            now.year === parsedDate.year &&
            now.month === parsedDate.month &&
            now.day === parsedDate.day;

        const isNextDate =
            now.year === nextDay.year &&
            now.month === nextDay.month &&
            now.day === nextDay.day;

        isProductionDate =
            (isStartDate && now.hour >= 22) ||
            (isNextDate && now.hour < 6);
    }

    const editable =
        isActive &&
        isProductionDate;

    const remainingMs =
        editable
            ? Math.max(
                0,
                end.getTime() -
                nowWallClock.getTime()
            )
            : 0;

    const remainingSeconds =
        Math.floor(
            remainingMs / 1000
        );

    return {
        isActive,

        isEditable: editable,

        isViewOnly: !editable,

        remainingMs,

        remainingSeconds,

        remainingTime:
            formatDuration(remainingMs),

        shift,

        shiftName:
            schedule.name,

        productionDate,

        timezone:
            TIMEZONE,

        startTime:
            formatTime(start),

        endTime:
            formatTime(end),

        startLabel:
            formatTime(start),

        endLabel:
            formatTime(end)
    };
}


/**
 * Mengecek apakah shift saat ini
 * boleh melakukan pengisian.
 */
function isShiftEditable(
    productionDate,
    shift,
    currentDateTime = new Date()
) {
    const status =
        getShiftStatus(
            productionDate,
            shift,
            currentDateTime
        );

    return status.isEditable;
}

module.exports = {
    TIMEZONE,
    SHIFT_SCHEDULE,
    getJakartaDateParts,
    formatDate,
    addOneDay,
    parseProductionDate,
    getShiftPeriod,
    formatTime,
    formatDuration,
    getShiftStatus,
    isShiftEditable
};