import jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt'
import { AppError } from "../types/app-error";
import { UserResponse } from '../payload/user-res';

//vytvorime JWT na zaklade id usera a username usera a primiesame tam JWT_SECRET z .env suboru
export function createJWT(user: UserResponse): string {
    const secret: string | undefined = process.env.JWT_SECRET
    if (!secret) throw new AppError(500, "JWT_SECRET is not defined")
    const token = jwt.sign({
        id: user.id,
        username: user.username
    }, secret, {expiresIn: '1h'})
    return token
}

export function hashPassword(password: string): Promise<string> {
    //cislo 5 specifikuje salt
    return bcrypt.hash(password, 5)
}

export function comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}
