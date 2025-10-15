import prisma from "../../database";
import { comparePasswords, createJWT, hashPassword } from "./auth";
import { AppError } from "../types/app-error";
import { Request, Response, NextFunction, RequestHandler } from "express"
import { UserRequest } from "../payload/user-req";
import { UserResponse } from "../payload/user-res";
import { TokenResponse } from "../payload/token-res";

export const signUp: RequestHandler<{}, UserResponse, UserRequest> = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new AppError(400, "Username and password are required")
        }
        const userExists: UserResponse | null = await findUser(username)
        if (userExists) {
            throw new AppError(400, "username already taken")
        }
        const user: UserResponse = await prisma.user.create({
            data: {
                username: username,
                password: await hashPassword(password) //musime pouzit await lebo bcrypt vracia promise
            }
        })
        res.status(201).json(user)
    } catch (error) {
        next(error)
    }
}

export const signIn: RequestHandler<{}, TokenResponse, UserRequest> = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new AppError(400, "Username and password are required")
        }
        const user: UserResponse |null = await findUser(username)
        if (!user) {
            throw new AppError(401, "wrong credentials")
        }
        const isValid: boolean = await comparePasswords(password, user.password) //musime pouzit await lebo bcrypt vracia promise
        if (!isValid) {
            throw new AppError(401, "wrong credentials")
        }
        const token: string = createJWT(user)
        const response: TokenResponse = {token: token}
        res.status(200).json(response)
    } catch (error) {
        next(error)
    }
}

async function findUser(username: string) {
    const user: UserResponse | null = await prisma.user.findUnique({
        where: {
            username: username
        }
    })
    return user
}