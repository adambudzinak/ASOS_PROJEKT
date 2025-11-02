import { Router } from "express";
import {
    testProtectedRoute,
    getUserData,
    updateAvatar,
    uploadPhoto,
    searchUsers,
    getUserByUsername,
    deletePhoto
} from "./controller/user";
import { storage } from "./middleware/multer-config";
import multer from "multer";

const router = Router()
const upload = multer({ storage });

router.get('/protected', testProtectedRoute)
router.get('/get-user', getUserData)
router.get("/search-users", searchUsers);
router.get("/user/:username", getUserByUsername);
router.post("/update-avatar", updateAvatar);
router.post("/upload-photo", upload.single("photo"), uploadPhoto);
router.delete("/photo/:id", deletePhoto);

export default router
