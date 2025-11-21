import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";


export async function getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const photos = await prisma.photo.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fname: true,
                        lname: true,
                        avatar: true
                    }
                },
                photoTags: {
                    include: {
                        tag: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fname: true,
                                lname: true,
                                avatar: true
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fname: true,
                                lname: true,
                                avatar: true
                            }
                        }
                    }
                },
                reposts: true
            }
        });

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const formattedPhotos = photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            likesCount: photo.likes.length,
            repostsCount: photo.reposts.length
        }));

        res.status(200).json({
            photos: formattedPhotos
        });
    } catch (error) {
        next(error);
    }
}
