import request from "supertest";
import app from "../server";
import prisma from "../database";
import { createJWT, hashPassword } from "../index/controller/auth";

let user: any;
let token: string;
let user2: any;
let token2: string;
let photoId: string;

beforeAll(async () => {

    await prisma.photoTag.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.repost.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});

    user = await prisma.user.create({
        data: {
            username: "tester",
            password: await hashPassword("password123"),
            fname: "John",
            lname: "Doe"
        }
    });
    token = createJWT(user);

    user2 = await prisma.user.create({
        data: {
            username: "tester2",
            password: await hashPassword("password123"),
            fname: "Jane",
            lname: "Doe"
        }
    });
    token2 = createJWT(user2);

    const photo = await prisma.photo.create({
        data: {
            filename: "test.jpg",
            userId: user2.id
        }
    });
    photoId = photo.id;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("User Integration Tests", () => {

    it("should access protected route", async () => {
        const res = await request(app)
            .get("/api/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("tester");
        expect(res.body.id).toBe(user.id);
        expect(res.body.message).toBe("hello from protected route");
    });

    it("should get own user data", async () => {
        const res = await request(app)
            .get("/api/get-user")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("tester");
        expect(res.body.photos).toBeDefined();
        expect(res.body.followers).toBe(0);
        expect(res.body.following).toBe(0);
    });

    it("should update avatar", async () => {
        const res = await request(app)
            .post("/api/update-avatar")
            .set("Authorization", `Bearer ${token}`)
            .send({ avatar: "new-avatar-url.jpg" });

        expect(res.status).toBe(200);
        expect(res.body.avatar).toBe("new-avatar-url.jpg");
    });

    it("should search users excluding current user", async () => {
        const res = await request(app)
            .get("/api/search-users")
            .query({ query: "tester" })
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBe(1);
        expect(res.body.users[0].username).toBe("tester2");
    });

    it("should get another user by username and return isFollowing false", async () => {
        const res = await request(app)
            .get(`/api/user/${user2.username}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(user2.username);
        expect(res.body.isFollowing).toBe(false);
    });

    it("should follow and get isFollowing true", async () => {

        await prisma.follow.create({
            data: { followerId: user.id, followingId: user2.id }
        });

        const res = await request(app)
            .get(`/api/user/${user2.username}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.isFollowing).toBe(true);
    });
});