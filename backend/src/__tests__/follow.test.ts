import request from "supertest";
import app from "../server";
import prisma from "../database";
import { createJWT, hashPassword } from "../index/controller/auth";

let user1: any;
let user2: any;
let user3: any;
let token1: string;
let token2: string;
let token3: string;

beforeAll(async () => {
    await prisma.follow.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.user.deleteMany({});

    user1 = await prisma.user.create({
        data: {
            username: "alice",
            password: await hashPassword("password123"),
            fname: "Alice",
            lname: "Smith"
        }
    });
    token1 = createJWT(user1);

    user2 = await prisma.user.create({
        data: {
            username: "bob",
            password: await hashPassword("password123"),
            fname: "Bob",
            lname: "Brown"
        }
    });
    token2 = createJWT(user2);


    user3 = await prisma.user.create({
        data: {
            username: "charlie",
            password: await hashPassword("password123"),
            fname: "Charlie",
            lname: "Black"
        }
    });
    token3 = createJWT(user3);
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Follow Integration Tests", () => {

    describe("POST /api/follow", () => {

        it("should follow a user", async () => {
            const res = await request(app)
                .post("/api/follow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: user2.id });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("User follow successful");
            expect(res.body.isFollowing).toBe(true);
            expect(res.body.followers).toBe(1);
        });

        it("should not allow following the same user twice", async () => {
            const res = await request(app)
                .post("/api/follow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: user2.id });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("You already follow this user");
        });

        it("should not allow following yourself", async () => {
            const res = await request(app)
                .post("/api/follow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: user1.id });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Cannot follow yourself");
        });

        it("should fail if user does not exist", async () => {
            const res = await request(app)
                .post("/api/follow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: "non-existing-id" });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("User not found");
        });
    });

    describe("POST /api/unfollow", () => {

        it("should unfollow a user", async () => {
            const res = await request(app)
                .post("/api/unfollow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: user2.id });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("User unfollow successful");
            expect(res.body.isFollowing).toBe(false);
        });

        it("should fail if not following user", async () => {
            const res = await request(app)
                .post("/api/unfollow")
                .set("Authorization", `Bearer ${token1}`)
                .send({ userId: user2.id });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("You do not follow this user");
        });
    });

    describe("GET followers / following", () => {

        beforeAll(async () => {

            await prisma.follow.create({
                data: {
                    followerId: user3.id,
                    followingId: user2.id
                }
            });
        });

        it("should get followers of user", async () => {
            const res = await request(app)
                .get(`/api/followers/${user2.id}`)
                .set("Authorization", `Bearer ${token1}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.followers)).toBe(true);
            expect(res.body.followers.length).toBe(1);
            expect(res.body.followers[0].username).toBe("charlie");
        });

        it("should get following of user", async () => {
            const res = await request(app)
                .get(`/api/following/${user3.id}`)
                .set("Authorization", `Bearer ${token1}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.following)).toBe(true);
            expect(res.body.following[0].username).toBe("bob");
        });
    });

    describe("GET /api/follow-status/:userId", () => {

        it("should return follow status true", async () => {
            const res = await request(app)
                .get(`/api/follow-status/${user2.id}`)
                .set("Authorization", `Bearer ${token3}`);

            expect(res.status).toBe(200);
            expect(res.body.isFollowing).toBe(true);
        });

        it("should return follow status false", async () => {
            const res = await request(app)
                .get(`/api/follow-status/${user1.id}`)
                .set("Authorization", `Bearer ${token3}`);

            expect(res.status).toBe(200);
            expect(res.body.isFollowing).toBe(false);
        });
    });
});