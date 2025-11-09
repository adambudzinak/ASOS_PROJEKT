import {AppError} from "../../index/types/app-error";
import {UserResponse} from "../../index/payload/user-res";
import prisma from "../../database";
import {Request, Response, NextFunction, RequestHandler} from "express"
import {AuthenticatedRequest} from "../../index/payload/auth-req";


export async function testProtectedRoute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    res.status(200).json({message: "hello from protected route", id: req.user?.id, username: req.user?.username})
}

export async function getUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({
            where: {username: req.user?.username},
            include: {
                photos: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        photoTags: { include: { tag: true } },
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
                },
                followers: true,
                following: true
            },
        });

        if (!user) throw new AppError(404, "User not found");

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photosWithUrls = user.photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            user: {
                id: user.id,
                username: user.username,
                fname: user.fname,
                lname: user.lname,
                avatar: user.avatar
            }
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
        const {avatar} = req.body;

        if (!avatar || typeof avatar !== "string") {
            throw new AppError(400, "Missing avatar data")
        }

        const updatedUser = await prisma.user.update({
            where: {username: req.user?.username},
            data: {avatar},
        });

        res.status(200).json({avatar: updatedUser.avatar});
    } catch (error) {
        next(error)
    }
}

export const searchUsers: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const query = (req.query.query as string)?.trim();

        if (!query || query.length < 1) {
            res.status(200).json({users: []});
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {username: {contains: query, mode: "insensitive"}},
                            {fname: {contains: query, mode: "insensitive"}},
                            {lname: {contains: query, mode: "insensitive"}},
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

        res.status(200).json({users});
    } catch (error) {
        next(error);
    }
}

export async function getUserByUsername(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const username = req.params.username;
        const currentUserId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: {username},
            include: {
                photos: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        photoTags: { include: { tag: true } },
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
                },
                followers: true,
                following: true
            },
        });

        if (!user) throw new AppError(404, "User not found");

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photosWithUrls = user.photos.map(photo => ({
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            user: {
                id: user.id,
                username: user.username,
                fname: user.fname,
                lname: user.lname,
                avatar: user.avatar
            }
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