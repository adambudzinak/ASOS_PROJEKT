import { AppError } from "../../index/types/app-error";
import { UserResponse } from "../../index/payload/user-res";
import prisma from "../../database";
import { Request, Response, NextFunction } from "express"
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function testProtectedRoute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    res.status(200).json({ message: "hello from protected route", id: req.user?.id, username: req.user?.username })
}

export async function getUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user: UserResponse | null = await prisma.user.findUnique({
        where: {
            username: req.user?.username
        }
    })
    res.status(200).json({ user })
}