import request from "supertest";
import app from "../server";
import prisma from "../database";
import { createJWT, hashPassword } from "../index/controller/auth";

let user: any;
let user2: any;
let user3: any;
let token: string;
let token2: string;
let token3: string;
let photo: any;
let commentId: string;

beforeAll(async () => {

    await prisma.comment.deleteMany({});
    await prisma.photoTag.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.repost.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});


    user = await prisma.user.create({
        data: {
            username: "commenter",
            password: await hashPassword("password123"),
            fname: "John",
            lname: "Doe"
        }
    });
    token = createJWT(user);


    user2 = await prisma.user.create({
        data: {
            username: "photoowner",
            password: await hashPassword("password123"),
            fname: "Jane",
            lname: "Doe"
        }
    });
    token2 = createJWT(user2);

    user3 = await prisma.user.create({
        data: {
            username: "intruder",
            password: await hashPassword("password123"),
            fname: "Evil",
            lname: "User"
        }
    });
    token3 = createJWT(user3);


    photo = await prisma.photo.create({
        data: {
            filename: "comment-test.jpg",
            userId: user2.id
        }
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Comments Integration Tests", () => {

    describe("POST /api/comment", () => {

        it("should add a comment to a photo", async () => {
            const res = await request(app)
                .post("/api/comment")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    photoId: photo.id,
                    text: "Nice photo!"
                });

            expect(res.status).toBe(201);
            expect(res.body.comment).toHaveProperty("id");
            expect(res.body.comment.text).toBe("Nice photo!");
            expect(res.body.comment.user.username).toBe("commenter");

            commentId = res.body.comment.id;
        });

        it("should fail if text is empty", async () => {
            const res = await request(app)
                .post("/api/comment")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    photoId: photo.id,
                    text: "   "
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Photo ID and comment text are required");
        });

        it("should fail if comment is too long", async () => {
            const longText = "a".repeat(101);

            const res = await request(app)
                .post("/api/comment")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    photoId: photo.id,
                    text: longText
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Comment too long");
        });

        it("should fail if photo does not exist", async () => {
            const res = await request(app)
                .post("/api/comment")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    photoId: "non-existing-id",
                    text: "Test comment"
                });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Photo not found");
        });
    });

    describe("GET /api/photo/:photoId/comments", () => {

        it("should return comments for a photo", async () => {
            const res = await request(app)
                .get(`/api/photo/${photo.id}/comments`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.comments)).toBe(true);
            expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
            expect(res.body.comments[0]).toHaveProperty("user");
        });
    });

    describe("DELETE /api/comment/:commentId", () => {

        it("should allow comment owner to delete comment", async () => {
            const res = await request(app)
                .delete(`/api/comment/${commentId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Comment deleted successfully");
        });

        it("should allow photo owner to delete comment", async () => {

            const comment = await prisma.comment.create({
                data: {
                    text: "Another comment",
                    photoId: photo.id,
                    userId: user.id
                }
            });

            const res = await request(app)
                .delete(`/api/comment/${comment.id}`)
                .set("Authorization", `Bearer ${token2}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Comment deleted successfully");
        });

        it("should fail if not authorized", async () => {
            const comment = await prisma.comment.create({
                data: {
                    text: "Protected comment",
                    photoId: photo.id,
                    userId: user.id
                }
            });

            const res = await request(app)
                .delete(`/api/comment/${comment.id}`)
                .set("Authorization", `Bearer ${token3}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Not authorized to delete this comment");
        });

        it("should return 404 if comment does not exist", async () => {
            const res = await request(app)
                .delete("/api/comment/nonexistent-id")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Comment not found");
        });
    });
});