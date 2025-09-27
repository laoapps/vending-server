import multer from "multer";

export const uploadExcelMemory = multer({
    storage: multer.memoryStorage(), // ไม่บันทึกไฟล์ลง disk
    limits: { fileSize: 10 * 1024 * 1024 }, // จำกัด 2MB (คุณบอก < 1MB กำลังดี)
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel" // .xls
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel files (.xls, .xlsx) are allowed"));
        }
    }
});
