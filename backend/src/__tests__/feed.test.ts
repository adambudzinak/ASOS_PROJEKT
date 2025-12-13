import request from "supertest";
import app from "../server";
import prisma from "../database";
import { createJWT, hashPassword } from "../index/controller/auth";

let user: any;
let user2: any;
let token: string;
let token2: string;
let photoId: string;

beforeAll(async () => {

    await prisma.photoTag.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.repost.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});

    user = await prisma.user.create({
        data: {
            username: "feed_user",
            password: await hashPassword("password123"),
            fname: "Feed",
            lname: "User"
        }
    });
    token = createJWT(user);

    user2 = await prisma.user.create({
        data: {
            username: "followed_user",
            password: await hashPassword("password123"),
            fname: "Followed",
            lname: "User"
        }
    });
    token2 = createJWT(user2);

    await prisma.follow.create({
        data: {
            followerId: user.id,
            followingId: user2.id
        }
    });

    const tag = await prisma.tag.create({
        data: { name: "nature" }
    });

    const photo = await prisma.photo.create({
        data: {
            filename: "nature.jpg",
            userId: user2.id
        }
    });
    photoId = photo.id;

    await prisma.photoTag.create({
        data: {
            photoId: photo.id,
            tagId: tag.id
        }
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Feed & Discovery Integration Tests", () => {

    // ================= FEED =================

    describe("GET /api/feed", () => {
        it("should return global feed", async () => {
            const res = await request(app)
                .get("/api/feed")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.photos)).toBe(true);
            expect(res.body.photos.length).toBeGreaterThan(0);
            expect(res.body.pagination).toBeDefined();
        });

        it("should support pagination", async () => {
            const res = await request(app)
                .get("/api/feed?page=1")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(1);
        });

        it("should filter feed by tag search", async () => {
            const res = await request(app)
                .get("/api/feed?search=nature")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.photos.length).toBe(1);
        });

        it("should return empty feed for non-existing tag", async () => {
            const res = await request(app)
                .get("/api/feed?search=unknown")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.photos.length).toBe(0);
        });
    });

    // ================= FOLLOWING FEED =================

    describe("GET /api/feed/following", () => {
        it("should return photos only from followed users", async () => {
            const res = await request(app)
                .get("/api/feed/following")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.photos.length).toBe(1);
            expect(res.body.photos[0].user.username).toBe("followed_user");
        });

        it("should return empty feed if user follows nobody", async () => {
            const lonelyUser = await prisma.user.create({
                data: {
                    username: "lonely_user",
                    password: await hashPassword("password123"),
                    fname: "Lonely",
                    lname: "User"
                }
            });
            const lonelyToken = createJWT(lonelyUser);

            const res = await request(app)
                .get("/api/feed/following")
                .set("Authorization", `Bearer ${lonelyToken}`);

            expect(res.status).toBe(200);
            expect(res.body.photos.length).toBe(0);
        });
    });

    // ================= TRENDING TAGS =================

    describe("GET /api/feed/trending-tags", () => {
        it("should return trending tags", async () => {
            const res = await request(app)
                .get("/api/feed/trending-tags")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tags.length).toBeGreaterThan(0);
            expect(res.body.tags[0]).toHaveProperty("name");
            expect(res.body.tags[0]).toHaveProperty("photoCount");
        });

        it("should support timeRange filter", async () => {
            const res = await request(app)
                .get("/api/feed/trending-tags?timeRange=7d")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.tags)).toBe(true);
        });
    });
});