import { Router } from "express";
import { testProtectedRoute  } from "./controller/user";
import { getUserData } from "./controller/user";
import { validateInput } from "../index/middleware/validation";

const router = Router()

router.get('/protected', testProtectedRoute)
router.get('/get-user', getUserData)

export default router
