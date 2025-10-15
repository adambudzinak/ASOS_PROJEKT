import { AppError } from "../../index/types/app-error";
import { Request, Response, NextFunction } from "express"
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function testProtectedRoute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    res.status(200).json({message: "hello from protected route", id: req.user?.id, username: req.user?.username})
}