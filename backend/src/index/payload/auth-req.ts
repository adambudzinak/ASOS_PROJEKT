import { Request } from "express"
import { JwtResponse } from "./jwt-res"

export interface AuthenticatedRequest extends Request {
  user?: JwtResponse;
  file?: Express.Multer.File;
}