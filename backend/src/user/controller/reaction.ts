import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function like(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try{
        const {photoId} = req.params;
        const userId = req.user!.id;
        const reactionType = "like"

        if (!photoId) {
            throw new AppError(400, "photoId is required");
        }

        // Find existing like
        const existingLike = await prisma.like.findFirst({
            where: {
                userId,
                photoId,
                reactionType
            }
        });

        if (existingLike) {
            // UNLIKE (remove)
            await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = false;

            res.status(200).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        } else {
            const anyExistingReaction = await prisma.like.findUnique({
                                                where: {
                                                    userId_photoId: {
                                                        userId,
                                                        photoId,
                                                    }
                                                }
                                            });
            if (anyExistingReaction){
                await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });
            }

            // LIKE (create)
            await prisma.like.create({
                data: {
                    userId,
                    photoId,
                    reactionType: reactionType
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = true;

            res.status(201).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        }
    }catch (error) {
        next(error);
    }
}

export async function heart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try{
        const {photoId} = req.params;
        const userId = req.user!.id;
        const reactionType = "heart"

        if (!photoId) {
            throw new AppError(400, "photoId is required");
        }

        // Find existing like
        const existingLike = await prisma.like.findFirst({
            where: {
                userId,
                photoId,
                reactionType
            }
        });

        if (existingLike) {
            // UNLIKE (remove)
            await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = false;

            res.status(200).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        } else {
            const anyExistingReaction = await prisma.like.findUnique({
                                                where: {
                                                    userId_photoId: {
                                                        userId,
                                                        photoId,
                                                    }
                                                }
                                            });
            if (anyExistingReaction){
                await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });
            }

            // LIKE (create)
            await prisma.like.create({
                data: {
                    userId,
                    photoId,
                    reactionType: reactionType
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = true;

            res.status(201).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        }
    }catch (error) {
        next(error);
    }
}

export async function smile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try{
        const {photoId} = req.params;
        const userId = req.user!.id;
        const reactionType = "smile"

        if (!photoId) {
            throw new AppError(400, "photoId is required");
        }

        // Find existing like
        const existingLike = await prisma.like.findFirst({
            where: {
                userId,
                photoId,
                reactionType
            }
        });

        if (existingLike) {
            // UNLIKE (remove)
            await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = false;

            res.status(200).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        } else {
            const anyExistingReaction = await prisma.like.findUnique({
                                                where: {
                                                    userId_photoId: {
                                                        userId,
                                                        photoId,
                                                    }
                                                }
                                            });
            if (anyExistingReaction){
                await prisma.like.delete({
                where: {
                    userId_photoId: {
                        userId,
                        photoId
                    }
                }
            });
            }

            // LIKE (create)
            await prisma.like.create({
                data: {
                    userId,
                    photoId,
                    reactionType: reactionType
                }
            });

            // Spočítame aktuálne liky
            const likesCount = await prisma.like.count({
                where: { photoId }
            });
            const isLiked = true;

            res.status(201).json({
                data:{
                    likesCount,
                    isLiked
                }
            });
        }
    }catch (error) {
        next(error);
    }
}

export async function getReactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.params;

        const reactions = await prisma.photo.findUnique({
            where: { id: photoId },
            include: {
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
                }
            }
        });

        if (!reactions) {
            throw new AppError(404, "Photo not found");
        }

        const likeCount = await prisma.like.count({
            where: {
                photoId: photoId,
                reactionType: "like"
            }
        });

        const heartCount = await prisma.like.count({
            where: {
                photoId: photoId,
                reactionType: "heart"
            }
        });

        const smileCount = await prisma.like.count({
            where: {
                photoId: photoId,
                reactionType: "smile"
            }
        });

        const reactionsResp = {
            ...reactions,
            likesCount: likeCount,
            heartCount: heartCount,
            smileCount: smileCount
        };

        res.status(200).json({ reactions: reactionsResp });
    } catch (error) {
        next(error);
    }
}