import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction, RequestHandler } from "express"
import { AppError } from '../types/app-error'
import { AuthenticatedRequest } from '../payload/auth-req'
import { JwtResponse } from '../payload/jwt-res'

export const protectRoute: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const bearer: string | undefined = req.headers.authorization

    //overime ci je pritomna authorization hlavicka
    if (!bearer) {
        return next(new AppError(401, "missing auth header"))
    }

    /*
    v http authorization hlavicke vyzera token takto: Bearer ASOUBPFAFGPDJFIOASJDbpsdasd43209nfapASD
    na ziskanie tokenu pouzijeme funkciu split s argumentom ' ', ktora nam vrati array
    na indexe 0 bude Bearer
    na indexe 1 bude ASOUBPFAFGPDJFIOASJDbpsdasd43209nfapASD
    */
    //overime ci ma authorization hlavicka token
    const [prefix, token]: string[] = bearer.split(' ')
    if (!token) {
        return next(new AppError(401, "no token"))
    }

    try {
        //ak je token platny tak funkcia verify() vrati payload s user datami, v nasom pripade to su tie, co sme
        //specifikovali pri vytvarani tokenu vo funkcii createJWT(): id, username
        //ak neni platny, tak sa preskoci do catch bloku
        if (!process.env.JWT_SECRET) {
            return next(new AppError(500, "JWT secret is not defined"))
        }

        //attachneme do requestu user data, aby k nim mohli pristupit dalsie funkcie
        //vdaka tomu budeme v kazdej funkcii, kt pouziva protect-route middleware, vediet, aky user robi request
        //netreba zabudat, ze v tomto user objekte mame len id a username, lebo len to ukladame vramci jwt
        const user: JwtResponse = jwt.verify(token, process.env.JWT_SECRET) as JwtResponse
        req.user = user
        next()
    } catch (err) {
        return next(new AppError(401, "invalid token"))
    }
}