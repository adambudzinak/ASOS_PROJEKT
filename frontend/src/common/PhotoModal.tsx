import { createPortal } from "react-dom";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import "./Modal.css";
import axios from "../auth/CrossOrigin";

interface User {
    id: string;
    username: string;
    fname: string;
    lname: string;
    avatar: string | null;
}

interface Comment {
    id: string;
    text: string;
    createdAt: string;
    user: User;
}

interface PhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: any[];
    initialIndex: number;
}

// Constants
const MAX_COMMENT_LENGTH = 100;
const MAX_COMMENT_DISPLAY_LENGTH = 20;

const PhotoModal: React.FC<PhotoModalProps> = ({
                                                   isOpen,
                                                   onClose,
                                                   photos,
                                                   initialIndex
                                               }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string>("");
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [currentPhotoData, setCurrentPhotoData] = useState<any>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const currentPhoto = photos[currentIndex];
    const isCommentTooLong = newComment.length > MAX_COMMENT_LENGTH;

    // Get token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    // Fetch photo details when photo changes
    useEffect(() => {
        if (isOpen && currentPhoto && token) {
            fetchPhotoDetails();
            fetchComments();
        }
    }, [isOpen, currentPhoto, token]);

    const fetchPhotoDetails = async () => {
        if (!token || !currentPhoto) return;

        try {
            // If current photo already has user data, use it
            if (currentPhoto.user) {
                setCurrentPhotoData(currentPhoto);
                return;
            }

            // Otherwise, fetch photo details from the backend
            const response = await axios.get(`/api/photo/${currentPhoto.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentPhotoData(response.data.photo);
        } catch (err: any) {
            console.error("Failed to fetch photo details", err);
            // Fallback to current photo data even without user info
            setCurrentPhotoData(currentPhoto);
        }
    };

    const fetchComments = async () => {
        if (!token || !currentPhoto) return;

        try {
            const response = await axios.get(`/api/photo/${currentPhoto.id}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(response.data.comments || []);
        } catch (err: any) {
            console.error("Failed to fetch comments", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            }
        }
    };

    // Auto-scroll to bottom when new comments are added
    useEffect(() => {
        if (comments.length > 0) {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !token || !currentPhoto) return;

        if (newComment.length > MAX_COMMENT_LENGTH) {
            alert(`Comment too long. Maximum ${MAX_COMMENT_LENGTH} characters allowed.`);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/comment',
                {
                    photoId: currentPhoto.id,
                    text: newComment
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setComments(prev => [...prev, response.data.comment]);
            setNewComment("");
        } catch (err: any) {
            console.error("Failed to add comment", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            } else if (err.response?.status === 400) {
                alert(err.response.data.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_COMMENT_LENGTH || value.length < newComment.length) {
            setNewComment(value);
        }
    };

    const toggleCommentExpansion = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const getDisplayComment = (comment: Comment) => {
        const isExpanded = expandedComments.has(comment.id);
        if (isExpanded || comment.text.length <= MAX_COMMENT_DISPLAY_LENGTH) {
            return comment.text;
        }
        return comment.text.substring(0, MAX_COMMENT_DISPLAY_LENGTH) + '...';
    };

    const prevPhoto = () => {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const nextPhoto = () => {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "ArrowLeft") prevPhoto();
            if (e.key === "ArrowRight") nextPhoto();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    // Safe user data extraction with better fallbacks
    const displayUser = currentPhotoData?.user || {
        fname: "Unknown",
        lname: "User",
        username: "unknown",
        avatar: null
    };

    const userDisplayName = `${displayUser.fname} ${displayUser.lname}`;
    const userUsername = `@${displayUser.username}`;

    return createPortal(
        <AnimatePresence>
            {isOpen && currentPhoto && (
                <>
                    <motion.div
                        className="imagecrop-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="photo-modal-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transformTemplate={({ x, y, scale }) => `translate(-50%, -50%) scale(${scale})`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="close-btn"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ×
                        </button>

                        {photos.length > 1 && (
                            <>
                                <button className="nav-btn prev-btn" onClick={prevPhoto}>
                                    <ChevronLeft size={24} />
                                </button>
                                <button className="nav-btn next-btn" onClick={nextPhoto}>
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}

                        <div className="modal-content-wrapper">
                            {/* Image Section */}
                            <div className="image-section-wrapper">
                                <img
                                    src={currentPhoto?.url}
                                    alt={`Photo by ${userDisplayName}`}
                                    className="modal-main-image"
                                />
                                {currentPhoto?.photoTags?.length > 0 && (
                                    <div className="tags-container">
                                        {currentPhoto.photoTags.map((pt: any) => (
                                            <span key={pt.tag.id} className="tag">
                                                #{pt.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="comments-section-wrapper">
                                {/* Photo Caption */}
                                <div className="photo-caption-section">
                                    <div className="comment-user-info">
                                        <img
                                            src={displayUser.avatar || "/default-avatar.png"}
                                            alt={userDisplayName}
                                            className="user-avatar-img"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "/default-avatar.png";
                                            }}
                                        />
                                        <div className="user-details">
                                            <span className="user-name-text">
                                                {userDisplayName}
                                            </span>
                                            <span className="user-username-text">
                                                {userUsername}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="comment-content-wrapper">
                                        <p className="comment-content">
                                            {currentPhoto?.description || "Shared a photo"}
                                        </p>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="comments-list-container">
                                    {comments.length === 0 ? (
                                        <div className="no-comments-message">
                                            <p>No comments yet</p>
                                            <p className="subtext">Be the first to comment!</p>
                                        </div>
                                    ) : (
                                        comments.map((comment) => {
                                            const displayText = getDisplayComment(comment);
                                            const isExpanded = expandedComments.has(comment.id);
                                            const shouldShowMore = comment.text.length > MAX_COMMENT_DISPLAY_LENGTH;

                                            return (
                                                <div key={comment.id} className="comment-item">
                                                    <div className="comment-user-info">
                                                        <img
                                                            src={comment.user.avatar || "/default-avatar.png"}
                                                            alt={`${comment.user.fname} ${comment.user.lname}`}
                                                            className="user-avatar-img"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/default-avatar.png";
                                                            }}
                                                        />
                                                        <div className="user-details">
                                                            <span className="user-name-text">
                                                                {comment.user.fname} {comment.user.lname}
                                                            </span>
                                                            <span className="user-username-text">
                                                                @{comment.user.username}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="comment-content-wrapper">
                                                        <p className="comment-content">
                                                            {displayText}
                                                        </p>
                                                        {shouldShowMore && (
                                                            <button
                                                                className="show-more-btn"
                                                                onClick={() => toggleCommentExpansion(comment.id)}
                                                            >
                                                                {isExpanded ? 'Show less' : 'Show more'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className="comment-date">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={commentsEndRef} />
                                </div>

                                {/* Add Comment */}
                                <div className="add-comment-section">
                                    <div className="comment-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={handleCommentChange}
                                            onKeyPress={handleKeyPress}
                                            disabled={loading || !token}
                                            className={`comment-input-field ${isCommentTooLong ? 'input-error' : ''}`}
                                            maxLength={MAX_COMMENT_LENGTH}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={loading || !newComment.trim() || !token || isCommentTooLong}
                                            className="send-comment-btn"
                                            title={isCommentTooLong ? `Comment must be ${MAX_COMMENT_LENGTH} characters or less` : "Post comment"}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="character-counter">
                                        <span className={isCommentTooLong ? 'counter-error' : 'counter-normal'}>
                                            {newComment.length}/{MAX_COMMENT_LENGTH}
                                        </span>
                                        {isCommentTooLong && (
                                            <span className="error-message">
                                                Comment too long
                                            </span>
                                        )}
                                    </div>
                                    {!token && (
                                        <p className="login-message">Please log in to comment</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PhotoModal;