import { Router } from "express";
import { testProtectedRoute  } from "./controllers/user";
import { validateInput } from "../index/middleware/validation";

const router = Router()

router.get('/protected', testProtectedRoute)


export default router
