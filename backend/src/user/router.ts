import { Router } from "express";
import { testProtectedRoute  } from "./controller/user";
import { getUserData } from "./controller/user";
import { updateAvatar } from "./controller/user";
import { uploadPhoto } from "./controller/user";
import { storage } from "./middleware/multer-config";
import multer from "multer";

const router = Router()
const upload = multer({ storage });

router.get('/protected', testProtectedRoute)
router.get('/get-user', getUserData)
router.post("/update-avatar", updateAvatar);
router.post("/upload-photo", upload.single("photo"), uploadPhoto); 

export default router
