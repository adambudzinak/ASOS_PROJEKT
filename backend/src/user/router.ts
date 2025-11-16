import { Router } from "express";
import {
    testProtectedRoute,
    getUserData,
    updateAvatar,
    searchUsers,
    getUserByUsername,
} from "./controller/user";
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus
} from "./controller/follow";
import { uploadPhoto, deletePhoto } from "./controller/photo";
import { storage } from "./middleware/multer-config";
import multer from "multer";

import {
    getComments,
    addComment,
    deleteComment
} from "./controller/comment";
import {
    repostPhoto,
    unrepostPhoto,
    checkRepostStatus,
    getRepostedPhotos
} from "./controller/repost";

import { getPhotoById } from "./controller/photo";

const router = Router()
const upload = multer({ storage });

router.get('/protected', testProtectedRoute)
router.get('/get-user', getUserData)
router.get("/search-users", searchUsers);
router.get("/user/:username", getUserByUsername);
router.post("/update-avatar", updateAvatar);

router.post("/upload-photo", upload.single("photo"), uploadPhoto);
router.delete("/photo/:id", deletePhoto);

router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/follow-status/:userId", checkFollowStatus);
router.get("/photo/:photoId", getPhotoById);

router.get("/photo/:photoId/comments", getComments);
router.post("/comment", addComment);
router.delete("/comment/:commentId", deleteComment);

router.post("/repost", repostPhoto);
router.post("/unrepost", unrepostPhoto);
router.get("/repost-status/:photoId", checkRepostStatus);
router.get("/reposts/:userId", getRepostedPhotos);

export default router