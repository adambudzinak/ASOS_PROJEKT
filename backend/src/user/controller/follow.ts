import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function followUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.body;
        const currentUserId = req.user!.id;

        if (!userId) {
            throw new AppError(400, "User ID required");
        }

        if (userId === currentUserId) {
            throw new AppError(400, "Cannot follow yourself");
        }

        const userToFollow = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToFollow) {
            throw new AppError(404, "User not found");
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        });

        if (existingFollow) {
            throw new AppError(400, "You already follow this user");
        }

        await prisma.follow.create({
            data: {
                followerId: currentUserId,
                followingId: userId
            }
        });

        const followerCount = await prisma.follow.count({
            where: { followingId: userId }
        });

        const followingCount = await prisma.follow.count({
            where: { followerId: userId }
        });

        res.status(200).json({
            message: "User follow successful",
            followers: followerCount,
            following: followingCount,
            isFollowing: true
        });
    } catch (error) {
        next(error);
    }
}

export async function unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.body;
        const currentUserId = req.user!.id;

        if (!userId) {
            throw new AppError(400, "User ID required");
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        });

        if (!existingFollow) {
            throw new AppError(400, "You do not follow this user");
        }

        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        });

        const followerCount = await prisma.follow.count({
            where: { followingId: userId }
        });

        const followingCount = await prisma.follow.count({
            where: { followerId: userId }
        });

        res.status(200).json({
            message: "User unfollow successful",
            followers: followerCount,
            following: followingCount,
            isFollowing: false
        });
    } catch (error) {
        next(error);
    }
}

export async function getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;

        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        fname: true,
                        lname: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const followersData = followers.map(f => f.follower);

        res.status(200).json({ followers: followersData });
    } catch (error) {
        next(error);
    }
}

export async function getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        fname: true,
                        lname: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const followingData = following.map(f => f.following);

        res.status(200).json({ following: followingData });
    } catch (error) {
        next(error);
    }
}

export async function checkFollowStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user!.id;

        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        });

        res.status(200).json({ isFollowing: !!isFollowing });
    } catch (error) {
        next(error);
    }
}