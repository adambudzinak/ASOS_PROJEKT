import request from "supertest";
import app from "../server";
import prisma from "../database";


beforeAll(async () => {
    await prisma.photoTag.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.repost.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Auth Integration Tests", () => {

    it("should register a new user", async () => {
        const res = await request(app)
            .post("/sign-up")
            .send({
                username: "tester",
                password: "password123",
                fname: "John",
                lname: "Doe"
            });

        expect(res.status).toBe(201);
        expect(res.body.username).toBe("tester");
        expect(res.body.id).toBeDefined();
    });

    it("should not allow duplicate usernames", async () => {
        const res = await request(app)
            .post("/sign-up")
            .send({
                username: "tester",
                password: "password123",
                fname: "John",
                lname: "Doe"
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Username already taken!");
    });

    it("should login successfully with correct credentials", async () => {
        const res = await request(app)
            .post("/sign-in")
            .send({
                username: "tester",
                password: "password123"
            });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("should fail login with wrong password", async () => {
        const res = await request(app)
            .post("/sign-in")
            .send({
                username: "tester",
                password: "wrongpassword"
            });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Wrong credentials!");
    });

    it("should fail login with non-existing username", async () => {
        const res = await request(app)
            .post("/sign-in")
            .send({
                username: "nonexistent",
                password: "password123"
            });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Wrong credentials!");
    });
});
