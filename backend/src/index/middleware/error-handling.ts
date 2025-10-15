import { Request, Response, NextFunction, ErrorRequestHandler } from "express"
import { AppError } from "../types/app-error"

//globalny middleware na synchronny aj asyncrhonny error handling
export const errorHandler: ErrorRequestHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status ?? 500
  const message = err.message ?? "something went wrong"
  res.status(statusCode).json({ message })
}