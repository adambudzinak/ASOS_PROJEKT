import request from "supertest";
import app from "../server";
import prisma from "../database";
import { createJWT, hashPassword } from "../index/controller/auth";
import { UserResponse } from "../index/payload/user-res";

let user: UserResponse;
let token: string;
let photoId: string;
let user2: UserResponse;
let token2: string;

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
            filename: "test_photo.jpg",
            userId: user.id
        }
    });
    photoId = photo.id;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Reactions Integration Tests", () => {
    describe("Like endpoint", () => {
        it("should like and unlike a photo", async () => {

            let res = await request(app)
                .post(`/api/like/${photoId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(201);

            res = await request(app)
                .post(`/api/like/${photoId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
        });
    });

    describe("Heart & Smile endpoints with different users", () => {
        it("should allow multiple reaction types by different users", async () => {
            const res1 = await request(app)
                .post(`/api/heart/${photoId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res1.status).toBe(201);

            const res2 = await request(app)
                .post(`/api/smile/${photoId}`)
                .set("Authorization", `Bearer ${token2}`);
            expect(res2.status).toBe(201);
        });
    });

    describe("Get reactions endpoint", () => {
        it("should return reaction counts for a photo", async () => {
            const res = await request(app)
                .get(`/api/reactions/${photoId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);

            expect(res.body).toHaveProperty("reactions");
            expect(res.body.reactions).toHaveProperty("likesCount");
            expect(res.body.reactions).toHaveProperty("heartCount");
            expect(res.body.reactions).toHaveProperty("smileCount");
            expect(res.body.reactions).toHaveProperty("likes");
        });
    });
});