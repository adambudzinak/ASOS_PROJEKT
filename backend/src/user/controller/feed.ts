import { Request, Response, NextFunction, RequestHandler } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

const PHOTOS_PER_PAGE = 10;

export async function getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        // Ziskaj page parameter, default je 1
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const skip = (page - 1) * PHOTOS_PER_PAGE;

        const [photos, total] = await Promise.all([
            prisma.photo.findMany({
                orderBy: { createdAt: "desc" },
                skip,
                take: PHOTOS_PER_PAGE,
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
                        orderBy: { createdAt: "desc" },
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
            }),
            prisma.photo.count()
        ]);

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const formattedPhotos = photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            likesCount: photo.likes.length,
            repostsCount: photo.reposts.length,
            comments: photo.comments
        }));

        const totalPages = Math.ceil(total / PHOTOS_PER_PAGE);
        const hasNextPage = page < totalPages;

        res.status(200).json({
            photos: formattedPhotos,
            pagination: {
                page,
                limit: PHOTOS_PER_PAGE,
                total,
                totalPages,
                hasNextPage
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getFollowingFeed: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const skip = (page - 1) * PHOTOS_PER_PAGE;

        // Najdi koho sledujeme
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);

        if (followingIds.length === 0) {
            res.status(200).json({
                photos: [],
                pagination: {
                    page,
                    limit: PHOTOS_PER_PAGE,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false
                }
            });
            return;
        }

        // Ziskaj fotky len od tych ludi co sledujeme
        const [photos, total] = await Promise.all([
            prisma.photo.findMany({
                where: { userId: { in: followingIds } },
                orderBy: { createdAt: "desc" },
                skip,
                take: PHOTOS_PER_PAGE,
                include: {
                    user: {
                        select: { id: true, username: true, fname: true, lname: true, avatar: true }
                    },
                    photoTags: { include: { tag: true } },
                    comments: {
                        take: 3,
                        orderBy: { createdAt: "desc" },
                        include: { user: { select: { id: true, username: true, fname: true, lname: true, avatar: true } } }
                    },
                    _count: {
                        select: {
                            likes: true,
                            reposts: true
                        }
                    }
                }
            }),
            prisma.photo.count({
                where: { userId: { in: followingIds } }
            })
        ]);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const formattedPhotos = photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            likesCount: photo._count.likes,
            repostsCount: photo._count.reposts,
            comments: photo.comments.reverse()
        }));

        const totalPages = Math.ceil(total / PHOTOS_PER_PAGE);
        const hasNextPage = page < totalPages;

        res.status(200).json({
            photos: formattedPhotos,
            pagination: {
                page,
                limit: PHOTOS_PER_PAGE,
                total,
                totalPages,
                hasNextPage
            }
        });
    } catch (error) {
        next(error);
    }
};