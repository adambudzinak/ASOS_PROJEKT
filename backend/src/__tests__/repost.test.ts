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

describe("Repost Integration Tests", () => {

    it("should repost a photo successfully", async () => {
        const res = await request(app)
            .post("/api/repost")
            .set("Authorization", `Bearer ${token}`)
            .send({ photoId });

        expect(res.status).toBe(200);
        expect(res.body.isReposted).toBe(true);
        expect(res.body.repost).toHaveProperty("id");
    });

    it("should not allow reposting the same photo twice", async () => {
        const res = await request(app)
            .post("/api/repost")
            .set("Authorization", `Bearer ${token}`)
            .send({ photoId });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("You already reposted this photo");
    });

    it("should not allow reposting own photo", async () => {
        const res = await request(app)
            .post("/api/repost")
            .set("Authorization", `Bearer ${token2}`)
            .send({ photoId });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Cannot repost your own photo");
    });

    it("should return 400 if photoId is missing", async () => {
        const res = await request(app)
            .post("/api/repost")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Photo ID required");
    });

    it("should check repost status", async () => {
        const res = await request(app)
            .get(`/api/repost-status/${photoId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.isReposted).toBe(true);
    });

    it("should unrepost a photo successfully", async () => {

        const res = await request(app)
            .post("/api/unrepost")
            .set("Authorization", `Bearer ${token}`)
            .send({ photoId });

        expect(res.status).toBe(200);
        expect(res.body.isReposted).toBe(false);
        expect(res.body.message).toBe("Repost removed successfully");
    });

    it("should not unrepost a photo that hasn't been reposted", async () => {
        const res = await request(app)
            .post("/api/unrepost")
            .set("Authorization", `Bearer ${token}`)
            .send({ photoId });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("You haven't reposted this photo");
    });

    it("should get all reposted photos for a user", async () => {

        await prisma.repost.create({
            data: { userId: user.id, photoId }
        });

        const res = await request(app)
            .get(`/api/reposts/${user.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.repostedPhotos.length).toBe(1);
        expect(res.body.repostedPhotos[0]).toHaveProperty("id", photoId);
        expect(res.body.repostedPhotos[0]).toHaveProperty("url");
        expect(res.body.repostedPhotos[0]).toHaveProperty("repostedAt");
    });
});