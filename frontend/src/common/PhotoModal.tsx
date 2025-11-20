import { createPortal } from "react-dom";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Repeat2, ThumbsUp, Heart, Smile, Users } from "lucide-react";
import "./Modal.css";
import axios from "../auth/CrossOrigin";
import ReactionsModal from "./ReactionsModal";

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
    currentUserId?: string;
}

// Constants
const MAX_COMMENT_LENGTH = 100;
const MAX_COMMENT_DISPLAY_LENGTH = 20;

const PhotoModal: React.FC<PhotoModalProps> = ({
                                                   isOpen,
                                                   onClose,
                                                   photos,
                                                   initialIndex,
                                                   currentUserId
                                               }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string>("");
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [currentPhotoData, setCurrentPhotoData] = useState<any>(null);
    const [isReposted, setIsReposted] = useState(false);
    const [repostLoading, setRepostLoading] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const [likeCount, setLikeCount] = useState<number>(0);
    const [isLikedState, setIsLikedState] = useState<boolean>(false);
    const [heartCount, setHeartCount] = useState<number>(0);
    const [isHeartState, setIsHeartState] = useState<boolean>(false);
    const [smileCount, setSmileCount] = useState<number>(0);
    const [isSmileState, setIsSmileState] = useState<boolean>(false);
    const [likeLoading, setLikeLoading] = useState<boolean>(false);
    const [heartLoading, setHeartLoading] = useState<boolean>(false);
    const [smileLoading, setSmileLoading] = useState<boolean>(false);

    const [openReactions, setOpenReactions] = useState(false);

    const currentPhoto = photos[currentIndex];
    const isCommentTooLong = newComment.length > MAX_COMMENT_LENGTH;
    const isOwnPhoto = currentUserId && currentPhotoData?.user?.id === currentUserId;

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

    useEffect(() => {
        if (!currentPhotoData || !token) return;
        fetchReactions();
    }, [currentPhotoData, token]);

    useEffect(() => {
        setIsLikedState(false);
        setLikeCount(0);
        setIsHeartState(false);
        setHeartCount(0);
        setIsSmileState(false);
        setSmileCount(0);
    }, [currentIndex]);

    // When currentPhotoData changes, initialize like state if available
    useEffect(() => {
        if (currentPhotoData) {
            setLikeCount(Number(currentPhotoData.likesCount || 0));
            const likedByCurrentUser = currentPhotoData?.likes?.some((reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "like")
            setIsLikedState(likedByCurrentUser)
            setHeartCount(Number(currentPhotoData.heartCount || 0));
            const heartByCurrentUser = currentPhotoData?.likes?.some((reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "heart")
            setIsHeartState(heartByCurrentUser)
            setSmileCount(Number(currentPhotoData.smileCount || 0));
            const smileByCurrentUser = currentPhotoData?.likes?.some((reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "smile")
            setIsSmileState(smileByCurrentUser)
        }
    }, [currentPhotoData]);

    // Fetch photo details when photo changes
    useEffect(() => {
        if (isOpen && currentPhoto && token) {
            fetchPhotoDetails();
            fetchComments();
            checkRepostStatus();
        }
    }, [isOpen, currentPhoto, token]);

    const fetchReactions = async () => {
        if (!token || !currentPhoto) return;

        try {
            const response = await axios.get(`/api/reactions/${currentPhoto.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLikeCount(Number(response.data.reactions.likesCount || 0));
            const likedByCurrentUser = response.data.reactions?.likes?.some(
                (reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "like"
            );
            setIsLikedState(likedByCurrentUser);
            setHeartCount(Number(response.data.reactions.heartCount || 0));
            const heartByCurrentUser = response.data.reactions?.likes?.some(
                (reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "heart"
            );
            setIsHeartState(heartByCurrentUser);
            setSmileCount(Number(response.data.reactions.smileCount || 0));
            const smileByCurrentUser = response.data.reactions?.likes?.some(
                (reaction: { user: { id: string | undefined; }; reactionType: string; }) => 
                    reaction.user.id === currentUserId && reaction.reactionType === "smile"
            );
            setIsSmileState(smileByCurrentUser);
        } catch (err: any) {
            console.error("Failed to fetch reactions", err);
        }
    }

    const fetchPhotoDetails = async () => {
        if (!token || !currentPhoto) return;

        try {
            if (currentPhoto.user) {
                setCurrentPhotoData(currentPhoto);
                return;
            }

            const response = await axios.get(`/api/photo/${currentPhoto.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentPhotoData(response.data.photo);
        } catch (err: any) {
            console.error("Failed to fetch photo details", err);
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

    const checkRepostStatus = async () => {
        if (!token || !currentPhoto || isOwnPhoto) return;

        try {
            const response = await axios.get(`/api/repost-status/${currentPhoto.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsReposted(response.data.isReposted);
        } catch (err: any) {
            console.error("Failed to check repost status", err);
        }
    };

    const handleRepostToggle = async () => {
        if (!token || !currentPhoto || isOwnPhoto) return;

        try {
            setRepostLoading(true);
            const endpoint = isReposted ? "/api/unrepost" : "/api/repost";

            const response = await axios.post(
                endpoint,
                { photoId: currentPhoto.id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setIsReposted(response.data.isReposted);
        } catch (err: any) {
            console.error("Failed to toggle repost", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            } else if (err.response?.data?.message) {
                alert(err.response.data.message);
            }
        } finally {
            setRepostLoading(false);
        }
    };

    // Handle like/unlike toggle 
    const handleLikeToggle = async () => {
        if (!currentPhoto || !token) return;

        // Prevent concurrent like/unlike calls
        if (likeLoading) return;

        setLikeLoading(true);

        const prevLiked = isLikedState;
        const prevCount = likeCount;
        try {
            if (isLikedState) {
                // optimistic: decrement
                setIsLikedState(false);
                setLikeCount(Math.max(0, prevCount - 1));

                const resp = await axios.post(`/api/like/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

                // sync server response if available
                if (resp.data?.likesCount !== undefined) setLikeCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsLikedState(Boolean(resp.data.isLiked));
            } else {
                // optimistic: increment
                setIsLikedState(true);
                setLikeCount(prevCount + 1);

                const resp = await axios.post(`/api/like/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

                if (resp.data?.likesCount !== undefined) setLikeCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsLikedState(Boolean(resp.data.isLiked));
            }
        } catch (err: any) {
            console.error("Failed to toggle like", err);
            // rollback optimistic update
            setIsLikedState(prevLiked);
            setLikeCount(prevCount);

        } finally {
            setLikeLoading(false);
            fetchReactions();
        }
    };

    // Handle like/unlike toggle 
    const handleHeartToggle = async () => {
        if (!currentPhoto || !token) return;

        // Prevent concurrent like/unlike calls
        if (heartLoading) return;

        setHeartLoading(true);

        const prevHeart = isHeartState;
        const prevCount = heartCount;
        try {
            if (isHeartState) {
                // optimistic: decrement
                setIsHeartState(false);
                setHeartCount(Math.max(0, prevCount - 1));

                const resp = await axios.post(`/api/heart/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

                // sync server response if available
                if (resp.data?.likesCount !== undefined) setHeartCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsHeartState(Boolean(resp.data.isLiked));
            } else {
                // optimistic: increment
                setIsHeartState(true);
                setHeartCount(prevCount + 1);

                const resp = await axios.post(`/api/heart/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

                if (resp.data?.likesCount !== undefined) setHeartCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsHeartState(Boolean(resp.data.isLiked));
            }
        } catch (err: any) {
            console.error("Failed to toggle like", err);
            // rollback optimistic update
            setIsHeartState(prevHeart);
            setHeartCount(prevCount);

        } finally {
            setHeartLoading(false);
            fetchReactions();
        }
    };

    // Handle like/unlike toggle 
    const handleSmileToggle = async () => {
        if (!currentPhoto || !token) return;

        // Prevent concurrent like/unlike calls
        if (smileLoading) return;

        setSmileLoading(true);

        const prevSmile = isSmileState;
        const prevCount = smileCount;
        try {
            if (isSmileState) {
                // optimistic: decrement
                setIsSmileState(false);
                setSmileCount(Math.max(0, prevCount - 1));

                const resp = await axios.post(`/api/smile/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });


                // sync server response if available
                if (resp.data?.likesCount !== undefined) setSmileCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsSmileState(Boolean(resp.data.isLiked));
            } else {
                // optimistic: increment
                setIsSmileState(true);
                setSmileCount(prevCount + 1);

                const resp = await axios.post(`/api/smile/${currentPhoto.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });


                if (resp.data?.likesCount !== undefined) setSmileCount(Number(resp.data.likesCount));
                if (resp.data?.isLiked !== undefined) setIsSmileState(Boolean(resp.data.isLiked));
            }
        } catch (err: any) {
            console.error("Failed to toggle like", err);
            // rollback optimistic update
            setIsSmileState(prevSmile);
            setSmileCount(prevCount);

        } finally {
            setSmileLoading(false);
            fetchReactions();
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

                                    {/* Repost Button - Only show if not own photo */}
                                    {!isOwnPhoto && token && (
                                        <button
                                            onClick={handleRepostToggle}
                                            disabled={repostLoading}
                                            className="repost-btn"
                                            style={{
                                                marginTop: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 16px',
                                                background: isReposted ? 'rgba(37, 117, 252, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                color: isReposted ? '#2575fc' : '#8e8e8e',
                                                cursor: repostLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: isReposted ? 600 : 400,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!repostLoading) {
                                                    e.currentTarget.style.background = isReposted ? 'rgba(37, 117, 252, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!repostLoading) {
                                                    e.currentTarget.style.background = isReposted ? 'rgba(37, 117, 252, 0.2)' : 'rgba(255, 255, 255, 0.05)';
                                                }
                                            }}
                                        >
                                            <Repeat2 size={18} />
                                            {repostLoading ? 'Loading...' : isReposted ? 'Reposted' : 'Repost'}
                                        </button>
                                    )}
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

                                {/*Like Section (placed after add-comment-section) */}
                                <div className="reactions-section" style={{ paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft:'16px', paddingRight:'16px' }}>
                                    <div style={{padding: '8px 8px'}}>
                                        <button
                                        className="like-btn"
                                        onClick={handleLikeToggle}
                                        disabled={likeLoading || !token}
                                        style={{
                                            paddingRight: '3px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: likeLoading || !token ? 'not-allowed' : 'pointer',
                                        }}
                                        >
                                            <ThumbsUp
                                            fill={isLikedState ? 'blue' : 'none'}
                                            />
                                        </button>
                                        <span className="like-count" aria-live="polite" style={{ fontSize: '0.95rem' }}>
                                            {likeCount}
                                        </span>
                                    </div>
                                    <div style={{padding: '8px 8px'}}>
                                        <button
                                        className="heart-btn"
                                        onClick={handleHeartToggle}
                                        disabled={heartLoading || !token}
                                        style={{
                                            paddingRight: '3px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: heartLoading || !token ? 'not-allowed' : 'pointer',
                                        }}
                                        >
                                            <Heart
                                            fill={isHeartState ? 'red' : 'none'}
                                            />
                                        </button>
                                        <span className="heart-count" aria-live="polite" style={{ fontSize: '0.95rem' }}>
                                            {heartCount}
                                        </span>
                                    </div>
                                    <div style={{padding: '8px 8px'}}>
                                        <button
                                        className="smile-btn"
                                        onClick={handleSmileToggle}
                                        disabled={smileLoading || !token}
                                        style={{
                                            paddingRight: '3px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: smileLoading || !token ? 'not-allowed' : 'pointer',
                                        }}
                                        >
                                            <Smile
                                            fill={isSmileState ? 'yellow' : 'none'}
                                            />
                                        </button>
                                        <span className="smile-count" aria-live="polite" style={{ fontSize: '0.95rem' }}>
                                            {smileCount}
                                        </span>
                                    </div>
                                    <div style={{display: "flex", justifySelf: "flex-end"}}>
                                        <button
                                        className="reactions-btn"
                                        onClick={() => setOpenReactions(true)}
                                        disabled={!token}
                                        style={{
                                            paddingRight: '3px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: !token ? 'not-allowed' : 'pointer',
                                        }}
                                        >
                                            <Users
                                            />
                                        </button>
                                    </div>
                                    <ReactionsModal isOpen={openReactions} onClose={() => setOpenReactions(false)} photoId={currentPhoto.id} token={token} />
                                    {!token && (
                                        <p className="login-message" style={{ margin: 0 }}>Please log in to like</p>
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