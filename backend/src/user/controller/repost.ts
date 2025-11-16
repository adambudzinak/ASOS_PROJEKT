import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function repostPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.body;
        const userId = req.user!.id;

        if (!photoId) {
            throw new AppError(400, "Photo ID required");
        }

        // Check if photo exists
        const photo = await prisma.photo.findUnique({
            where: { id: photoId }
        });

        if (!photo) {
            throw new AppError(404, "Photo not found");
        }

        // Don't allow reposting own photos
        if (photo.userId === userId) {
            throw new AppError(400, "Cannot repost your own photo");
        }

        // Check if already reposted
        const existingRepost = await prisma.repost.findUnique({
            where: {
                userId_photoId: {
                    userId,
                    photoId
                }
            }
        });

        if (existingRepost) {
            throw new AppError(400, "You already reposted this photo");
        }

        // Create repost
        const repost = await prisma.repost.create({
            data: {
                userId,
                photoId
            }
        });

        res.status(200).json({
            message: "Photo reposted successfully",
            repost,
            isReposted: true
        });
    } catch (error) {
        next(error);
    }
}

export async function unrepostPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.body;
        const userId = req.user!.id;

        if (!photoId) {
            throw new AppError(400, "Photo ID required");
        }

        const existingRepost = await prisma.repost.findUnique({
            where: {
                userId_photoId: {
                    userId,
                    photoId
                }
            }
        });

        if (!existingRepost) {
            throw new AppError(400, "You haven't reposted this photo");
        }

        await prisma.repost.delete({
            where: {
                userId_photoId: {
                    userId,
                    photoId
                }
            }
        });

        res.status(200).json({
            message: "Repost removed successfully",
            isReposted: false
        });
    } catch (error) {
        next(error);
    }
}

export async function checkRepostStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.params;
        const userId = req.user!.id;

        const repost = await prisma.repost.findUnique({
            where: {
                userId_photoId: {
                    userId,
                    photoId
                }
            }
        });

        res.status(200).json({ isReposted: !!repost });
    } catch (error) {
        next(error);
    }
}

export async function getRepostedPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;

        const reposts = await prisma.repost.findMany({
            where: { userId },
            include: {
                photo: {
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
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const repostedPhotos = reposts.map(repost => ({
            ...repost.photo,
            url: `${baseUrl}/uploads/${repost.photo.filename}`,
            repostedAt: repost.createdAt
        }));

        res.status(200).json({ repostedPhotos });
    } catch (error) {
        next(error);
    }
}