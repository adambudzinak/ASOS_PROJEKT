import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";

export async function getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.params;

        const comments = await prisma.comment.findMany({
            where: { photoId },
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
        });

        res.status(200).json({ comments });
    } catch (error) {
        next(error);
    }
}

export async function addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId, text } = req.body;
        const userId = req.user!.id;

        // Validation
        if (!photoId || !text || text.trim().length === 0) {
            throw new AppError(400, "Photo ID and comment text are required");
        }

        // Comment length validation
        const MAX_COMMENT_LENGTH = 100;
        if (text.length > MAX_COMMENT_LENGTH) {
            throw new AppError(400, `Comment too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`);
        }

        // Check if photo exists
        const photo = await prisma.photo.findUnique({
            where: { id: photoId }
        });

        if (!photo) {
            throw new AppError(404, "Photo not found");
        }

        const comment = await prisma.comment.create({
            data: {
                text: text.trim(),
                photoId,
                userId
            },
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
        });

        res.status(201).json({ comment });
    } catch (error) {
        next(error);
    }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { commentId } = req.params;
        const userId = req.user!.id;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            throw new AppError(404, "Comment not found");
        }

        // Check if user owns the comment or is the photo owner
        const photo = await prisma.photo.findUnique({
            where: { id: comment.photoId }
        });

        if (comment.userId !== userId && photo?.userId !== userId) {
            throw new AppError(403, "Not authorized to delete this comment");
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        next(error);
    }
}