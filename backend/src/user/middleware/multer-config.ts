import multer from "multer";
import path from "path";

export const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../../uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueName = "photo_" + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});