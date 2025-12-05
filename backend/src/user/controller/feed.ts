import { Request, Response, NextFunction, RequestHandler } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

const PHOTOS_PER_PAGE = 10;

const getPhotoInclude = () => ({
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
        orderBy: { createdAt: "desc" as const }
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
});

const formatPhotoData = (photos: any[], baseUrl: string) => {
    return photos.map(photo => ({
        ...photo,
        url: `${baseUrl}/uploads/${photo.filename}`,
        likesCount: photo.likes.length,
        repostsCount: photo.reposts.length,
        comments: photo.comments
    }));
};

export async function getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const skip = (page - 1) * PHOTOS_PER_PAGE;
        const searchQuery = (req.query.search as string)?.trim().toLowerCase();

        let whereClause: any = {};

        if (searchQuery && searchQuery.length > 0) {
            whereClause = {
                photoTags: {
                    some: {
                        tag: {
                            name: {
                                contains: searchQuery,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            };
        }

        const [photos, total] = await Promise.all([
            prisma.photo.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: PHOTOS_PER_PAGE,
                include: getPhotoInclude()
            }),
            prisma.photo.count({ where: whereClause })
        ]);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const formattedPhotos = formatPhotoData(photos, baseUrl);

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
        const searchQuery = (req.query.search as string)?.trim().toLowerCase();

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);

        let whereClause: any = {
            userId: { in: followingIds }
        };

        if (searchQuery && searchQuery.length > 0) {
            whereClause = {
                ...whereClause,
                photoTags: {
                    some: {
                        tag: {
                            name: {
                                contains: searchQuery,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            };
        }

        const [photos, total] = await Promise.all([
            prisma.photo.findMany({
                where: followingIds.length === 0 ? { id: "" } : whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: PHOTOS_PER_PAGE,
                include: getPhotoInclude()
            }),
            prisma.photo.count({
                where: followingIds.length === 0 ? { id: "" } : whereClause
            })
        ]);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const formattedPhotos = formatPhotoData(photos, baseUrl);

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

export async function getTrendingTags(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const timeRange = (req.query.timeRange as string) || "all";

        const now = new Date();
        let fromDate = new Date(0);

        switch (timeRange) {
            case "1d":
                fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "7d":
                fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "1y":
                fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case "all":
            default:
                fromDate = new Date(0);
        }

        const tags = await prisma.tag.findMany({
            include: {
                photos: {
                    where: {
                        photo: {
                            createdAt: {
                                gte: fromDate
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        photos: {
                            where: {
                                photo: {
                                    createdAt: {
                                        gte: fromDate
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                photos: {
                    _count: "desc"
                }
            },
            take: 20
        });

        res.status(200).json({
            tags: tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                photoCount: tag._count.photos
            }))
        });
    } catch (error) {
        next(error);
    }
}