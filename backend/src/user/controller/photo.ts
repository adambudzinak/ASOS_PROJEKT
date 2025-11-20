import { Request, Response, NextFunction } from "express";
import prisma from "../../database";
import { AppError } from "../../index/types/app-error";
import { AuthenticatedRequest } from "../../index/payload/auth-req";
import fs from "fs";
import path from "path";

export async function uploadPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            throw new AppError(400, "No file uploaded");
        }

        const filename = req.file.filename;

        const tagInput = (req.body.tags as string) || "";
        const tagNames = tagInput
            .split(" ")
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0);

        const tags = await Promise.all(
            tagNames.map(async (name) => {
                return prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                });
            })
        );

        const newPhoto = await prisma.photo.create({
            data: {
                filename,
                userId: req.user!.id,
                photoTags: {
                    create: tags.map(tag => ({
                        tag: {
                            connect: { id: tag.id },
                        },
                    })),
                },
            },
            include: {
                photoTags: { include: { tag: true } },
            },
        });

        res.status(201).json({ photo: newPhoto });
    } catch (error) {
        next(error);
    }
}

export async function deletePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const photoId = req.params.id;
        const userId = req.user!.id;

        const photo = await prisma.photo.findUnique({where: {id: photoId}});
        if (!photo) throw new AppError(404, "Photo not found");

        if (photo.userId !== userId) throw new AppError(403, "Not authorized to delete this photo");

        const filePath = path.join(process.cwd(), "uploads", photo.filename);

        await prisma.photo.delete({where: {id: photoId}});

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({message: "Photo deleted successfully"});
    } catch (error) {
        next(error);
    }
}

export async function getPhotoById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { photoId } = req.params;

        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
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
                }
            }
        });

        if (!photo) {
            throw new AppError(404, "Photo not found");
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photoWithUrl = {
            ...photo,
            url: `${baseUrl}/uploads/${photo.filename}`,
            likesCount: photo.likes.length
        };

        res.status(200).json({ photo: photoWithUrl });
    } catch (error) {
        next(error);
    }
}