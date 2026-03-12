import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /csv|xlsx|xls|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports CSV or Excel files!"));
    }
});
