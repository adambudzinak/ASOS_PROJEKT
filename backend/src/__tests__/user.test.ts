import app from "../server"
import request from "supertest"

//unit test example
describe("user handler", () => {
    it("should do a thing", () => {
        expect(1).toBe(1)
    })
})

//integration test example
describe("POST /sign-up", () => {
    it("should create a new user & respond with json", async () => {
        const response = await request(app)
            .post("/sign-up")
            .send({
                username: "username",
                password: "password"
            })
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.username).toBe("username");
    })
})