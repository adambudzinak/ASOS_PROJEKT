import { body } from "express-validator"
import { validationResult } from "express-validator"
import { Request, Response, NextFunction, RequestHandler } from "express"


export const validateInput: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

export const signUpValidations = [
  body("username")
    .exists().withMessage("Username is required.")
    .isString().withMessage("Username must be a string.")
    .isLength({ min: 3, max: 20 }).withMessage("Username must be 3-20 characters long."),

  body("fname")
    .exists().withMessage("First name is required.")
    .isString().withMessage("First name must be a string.")
    .isLength({ min: 3, max: 20 }).withMessage("First name must be 3-20 characters long."),

  body("lname")
    .exists().withMessage("Last name is required.")
    .isString().withMessage("Last name must be a string.")
    .isLength({ min: 3, max: 20 }).withMessage("Last name must be 3-20 characters long."),

  body("password")
    .exists().withMessage("Password is required.")
    .isString().withMessage("Password must be a string.")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
];