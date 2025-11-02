import "../profile/Profile.css"
import React, { useEffect, useState } from "react";
import axios from "../../auth/CrossOrigin";
import "../home-screen/HomeScreen.css";
import { createPortal } from "react-dom";
import PhotoModal from "../../common/PhotoModal";

interface UserProfileProps {
    token: string;
    username: string;
    onBack: () => void;
}
const UserProfile: React.FC<UserProfileProps> = ({ token, username, onBack }) => {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("/stock-profile-pic.png");
    const [photos, setPhotos] = useState<any[]>([]);
    const [posts, setPosts] = useState(0);
    const [followers, setFollowers] = useState<number>(0);
    const [following, setFollowing] = useState<number>(0);

    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const openPhotoModal = (index: number) => {
        setCurrentPhotoIndex(index);
        setPhotoModalOpen(true);
    };
    const closePhotoModal = () => setPhotoModalOpen(false);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`/api/user/${username}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = response.data;

            setFname(user.fname);
            setLname(user.lname);
            setFollowers(user.followers || 0);
            setFollowing(user.following || 0);
            setAvatarUrl(user.avatar || "/stock-profile-pic.png");
            if (user.photos) {
                setPhotos(user.photos.map((p: any) => ({ id: p.id, url: p.url })));
                setPosts(user.photos.length);
            }
        } catch (err) {
            console.error("Failed to fetch user profile", err);
        }
    };

    useEffect(() => {
        if (username) fetchUserProfile();
    }, [username]);

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
                            <div className="avatar-wrapper" style={{ width: 120, height: 120 }}>
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="profile-pic"
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                            <h3 className="profile-name">
                                {fname} {lname}
                            </h3>
                            <span className="stats-label">@{username}</span>
                        </div>

                        <div className="profile-right">
                            <div className="stats-item">
                                <span className="stats-value">{posts}</span>
                                <span className="stats-label">Posts</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{followers}</span>
                                <span className="stats-label">Followers</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{following}</span>
                                <span className="stats-label">Following</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-gallery">
                    {photos.map((photo, idx) => (
                        <div
                            key={idx}
                            className="gallery-item"
                            onClick={() => openPhotoModal(idx)}
                        >
                            <img
                                src={photo.url}
                                alt={`Photo ${idx + 1}`}
                                style={{ cursor: "pointer" }}
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
                        photos={photos}
                        initialIndex={currentPhotoIndex}
                    />,
                    document.body
                )}
        </>
    );
};

export default UserProfile;