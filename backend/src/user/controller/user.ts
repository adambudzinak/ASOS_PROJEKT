import { AppError } from "../../index/types/app-error";
import { UserResponse } from "../../index/payload/user-res";
import prisma from "../../database";
import { Request, Response, NextFunction, RequestHandler } from "express"
import { AuthenticatedRequest } from "../../index/payload/auth-req";
import fs from "fs";
import path from "path";

export async function testProtectedRoute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    res.status(200).json({ message: "hello from protected route", id: req.user?.id, username: req.user?.username })
}

export async function getUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.user?.username },
            include: {
                photos: { orderBy: { createdAt: "desc" } },
                followers: true,
                following: true
            },
        });

        if (!user) throw new AppError(404, "User not found");

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photosWithUrls = user.photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
        }));

        res.status(200).json({
            ...user,
            photos: photosWithUrls,
            followers: user.followers.length,
            following: user.following.length
        });
    } catch (error) {
        next(error)
    }
}

export async function updateAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { avatar } = req.body;

        if (!avatar || typeof avatar !== "string") {
            throw new AppError(400, "Missing avatar data")
        }

        const updatedUser = await prisma.user.update({
            where: { username: req.user?.username },
            data: { avatar },
        });

        res.status(200).json({ avatar: updatedUser.avatar });
    } catch (error) {
        next(error)
    }
}

export async function uploadPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            throw new AppError(400, "No file uploaded");
        }

        const filename = req.file.filename;

        const newPhoto = await prisma.photo.create({
            data: {
                filename,
                userId: req.user!.id,
            },
        });

        res.status(201).json({ photo: newPhoto });
    } catch (error) {
        next(error)
    }
}

export const searchUsers: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const query = (req.query.query as string)?.trim();

        if (!query || query.length < 1) {
            res.status(200).json({ users: [] });
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { username: { contains: query, mode: "insensitive" } },
                            { fname: { contains: query, mode: "insensitive" } },
                            { lname: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    {
                        NOT: {
                            id: req.user?.id,
                        },
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                fname: true,
                lname: true,
                avatar: true,
            },
            take: 20,
        });

        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
}

export async function getUserByUsername(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const username = req.params.username;
        const currentUserId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                photos: { orderBy: { createdAt: "desc" } },
                followers: true,
                following: true
            },
        });

        if (!user) throw new AppError(404, "User not found");

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photosWithUrls = user.photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
        }));

        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: user.id
                }
            }
        });

        res.status(200).json({
            ...user,
            photos: photosWithUrls,
            followers: user.followers.length,
            following: user.following.length,
            isFollowing: !!isFollowing
        });
    } catch (error) {
        next(error);
    }
}

export async function deletePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const photoId = req.params.id;
        const userId = req.user!.id;

        const photo = await prisma.photo.findUnique({ where: { id: photoId } });
        if (!photo) throw new AppError(404, "Photo not found");

        if (photo.userId !== userId) throw new AppError(403, "Not authorized to delete this photo");

        const filePath = path.join(process.cwd(), "uploads", photo.filename);

        await prisma.photo.delete({ where: { id: photoId } });

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
        next(error);
    }
}