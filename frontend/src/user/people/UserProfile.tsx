import "../profile/Profile.css"
import React, {useEffect, useState} from "react";
import axios from "../../auth/CrossOrigin";
import "../home-screen/HomeScreen.css";
import {createPortal} from "react-dom";
import PhotoModal from "../../common/PhotoModal";
import FollowersModal from "../../common/FollowersModal";

interface UserProfileProps {
    token: string;
    username: string;
    onBack: () => void;
}

type PhotoViewType = "personal" | "reposted";

const UserProfile: React.FC<UserProfileProps> = ({token, username, onBack}) => {
    const [userId, setUserId] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("/stock-profile-pic.png");
    const [photos, setPhotos] = useState<any[]>([]);
    const [repostedPhotos, setRepostedPhotos] = useState<any[]>([]);
    const [posts, setPosts] = useState(0);
    const [followers, setFollowers] = useState<number>(0);
    const [following, setFollowing] = useState<number>(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [photoView, setPhotoView] = useState<PhotoViewType>("personal");

    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const [followersModalOpen, setFollowersModalOpen] = useState(false);
    const [followingModalOpen, setFollowingModalOpen] = useState(false);

    const openPhotoModal = (index: number) => {
        setCurrentPhotoIndex(index);
        setPhotoModalOpen(true);
    };

    const closePhotoModal = () => {
        setPhotoModalOpen(false);
        // Refresh reposted photos when modal closes
        if (photoView === "reposted") {
            fetchRepostedPhotos();
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`/api/user/${username}`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            const user = response.data;

            setUserId(user.id);
            setFname(user.fname);
            setLname(user.lname);
            setFollowers(user.followers || 0);
            setFollowing(user.following || 0);
            setAvatarUrl(user.avatar || "/stock-profile-pic.png");
            setIsFollowing(user.isFollowing || false);
            if (user.photos) {
                setPhotos(user.photos.map((p: any) => ({
                    id: p.id,
                    url: p.url,
                    photoTags: p.photoTags || [],
                    user: p.user
                })));
                setPosts(user.photos.length);
            }
        } catch (err) {
            console.error("Failed to fetch user profile", err);
        }
    };

    const fetchRepostedPhotos = async () => {
        try {
            const response = await axios.get(`/api/reposts/${userId}`, {
                headers: {Authorization: `Bearer ${token}`}
            });
            setRepostedPhotos(response.data.repostedPhotos.map((p: any) => ({
                id: p.id,
                url: p.url,
                photoTags: p.photoTags || [],
                user: p.user,
                repostedAt: p.repostedAt
            })));
        } catch (err: any) {
            console.error("Failed to fetch reposted photos", err);
        }
    };

    const fetchCurrentUserId = async () => {
        try {
            const response = await axios.get("/api/get-user", {
                headers: {Authorization: `Bearer ${token}`}
            });
            setCurrentUserId(response.data.id);
        } catch (err) {
            console.error("Failed to fetch current user", err);
        }
    };

    useEffect(() => {
        if (username) {
            fetchUserProfile();
            fetchCurrentUserId();
        }
    }, [username]);

    useEffect(() => {
        if (userId && photoView === "reposted") {
            fetchRepostedPhotos();
        }
    }, [userId, photoView]);

    const handleFollowToggle = async () => {
        try {
            setLoadingFollow(true);
            const endpoint = isFollowing ? "/api/unfollow" : "/api/follow";

            const response = await axios.post(
                endpoint,
                {userId},
                {headers: {Authorization: `Bearer ${token}`}}
            );

            setIsFollowing(response.data.isFollowing);
            setFollowers(response.data.followers);
        } catch (err) {
            console.error("Failed to toggle follow", err);
        } finally {
            setLoadingFollow(false);
        }
    };

    const displayedPhotos = photoView === "personal" ? photos : repostedPhotos;

    return (
        <>
            <div className="home-blurred-card d-flex flex-column align-items-center p-4 mb-4">
                <button
                    onClick={onBack}
                    className="btn btn-outline-light align-self-start mb-3"
                >
                    ← Back
                </button>

                <div className="profile-container">
                    <div className="profile-card">
                        <div className="profile-left">
                            <div className="avatar-wrapper" style={{width: 120, height: 120}}>
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="profile-pic"
                                    style={{width: "100%", height: "100%"}}
                                />
                            </div>
                            <h3 className="profile-name">
                                {fname} {lname}
                            </h3>
                            <span className="stats-label">@{username}</span>
                            <button
                                onClick={handleFollowToggle}
                                disabled={loadingFollow}
                                className="glass-button mt-3"
                                style={{
                                    maxWidth: "200px",
                                    background: isFollowing
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : "rgba(255, 255, 255, 0.15)"
                                }}
                            >
                                {loadingFollow ? "..." : isFollowing ? "Unfollow" : "Follow"}
                            </button>
                        </div>

                        <div className="profile-right">
                            <div className="stats-item">
                                <span className="stats-value">{posts}</span>
                                <span className="stats-label">Posts</span>
                            </div>
                            <div className="stats-item" style={{cursor: "pointer"}}
                                 onClick={() => setFollowersModalOpen(true)}>
                                <span className="stats-value">{followers}</span>
                                <span className="stats-label">Followers</span>
                            </div>
                            <div className="stats-item" style={{cursor: "pointer"}}
                                 onClick={() => setFollowingModalOpen(true)}>
                                <span className="stats-value">{following}</span>
                                <span className="stats-label">Following</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photo View Toggle */}
                <div className="photo-view-toggle" style={{
                    display: 'flex',
                    gap: '0',
                    marginTop: '20px',
                    marginBottom: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '4px',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <button
                        onClick={() => setPhotoView("personal")}
                        style={{
                            flex: 1,
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '10px',
                            background: photoView === "personal" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                            color: 'white',
                            fontWeight: photoView === "personal" ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem'
                        }}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setPhotoView("reposted")}
                        style={{
                            flex: 1,
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '10px',
                            background: photoView === "reposted" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                            color: 'white',
                            fontWeight: photoView === "reposted" ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem'
                        }}
                    >
                        Reposted
                    </button>
                </div>

                <div className="profile-gallery">
                    {displayedPhotos.map((photo, idx) => (
                        <div key={idx} className="gallery-item photo-item" onClick={() => openPhotoModal(idx)}
                             style={{position: "relative"}}
                        >
                            <img
                                src={photo.url}
                                alt={`Photo ${idx + 1}`}
                                style={{cursor: "pointer"}}
                            />
                        </div>
                    ))}
                </div>

            </div>

            {photoModalOpen &&
                createPortal(
                    <PhotoModal
                        isOpen={photoModalOpen}
                        onClose={closePhotoModal}
                        photos={displayedPhotos}
                        initialIndex={currentPhotoIndex}
                        currentUserId={currentUserId}
                    />,
                    document.body
                )}

            {followersModalOpen &&
                createPortal(
                    <FollowersModal
                        isOpen={followersModalOpen}
                        onClose={() => setFollowersModalOpen(false)}
                        userId={userId}
                        type="followers"
                        token={token}
                    />,
                    document.body
                )}

            {followingModalOpen &&
                createPortal(
                    <FollowersModal
                        isOpen={followingModalOpen}
                        onClose={() => setFollowingModalOpen(false)}
                        userId={userId}
                        type="following"
                        token={token}
                    />,
                    document.body
                )}
        </>
    );
};

export default UserProfile;