import {createJWT, hashPassword, comparePasswords} from "../index/controller/auth";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "testsecret";
describe("Auth utils", () => {
    it("should create a valid JWT token", () => {
        process.env.JWT_SECRET = "testsecret";
        const mockUser = {id: 1, username: "tester"} as any;
        const token = createJWT(mockUser);
        const decoded = jwt.verify(token, "testsecret") as any;
        expect(decoded.id).toBe(1);
        expect(decoded.username).toBe("tester");
    });
    it("should hash and compare passwords correctly", async () => {
        const password = "mypassword";
        const hashed = await hashPassword(password);
        expect(hashed).not.toBe(password);
        const match = await comparePasswords(password, hashed);
        expect(match).toBe(true);
    });
});