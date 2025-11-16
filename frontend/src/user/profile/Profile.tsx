import React from "react";
import axios from "../../auth/CrossOrigin";
import "../home-screen/HomeScreen.css"
import {useEffect, useState} from "react";
import PhotoModal from "../../common/PhotoModal";
import "./Profile.css"
import PencilIcon from "../../common/PencilIcon";
import {createPortal} from "react-dom";
import ImageCropModal from "../../common/UploadModal";
import {X} from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";
import FollowersModal from "../../common/FollowersModal";

interface ProfileProps {
    token: string;
}

type PhotoViewType = "personal" | "reposted";

const Profile: React.FC<ProfileProps> = ({token}) => {
    const [userId, setUserId] = useState("");
    const [username, setUsername] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [followers, setFollowers] = useState<number>(0);
    const [following, setFollowing] = useState<number>(0);
    const [posts, setPosts] = useState<number>(0);

    const [avatarUrl, setAvatarUrl] = useState("/stock-profile-pic.png");
    const [modalOpen, setModalOpen] = useState(false);

    const [photos, setPhotos] = useState<any[]>([]);
    const [repostedPhotos, setRepostedPhotos] = useState<any[]>([]);
    const [photoView, setPhotoView] = useState<PhotoViewType>("personal");

    const [modalFor, setModalFor] = useState<"avatar" | "photo" | null>(null);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

    const [followersModalOpen, setFollowersModalOpen] = useState(false);
    const [followingModalOpen, setFollowingModalOpen] = useState(false);

    const openModal = (type: "avatar" | "photo") => {
        setModalFor(type);
        setModalOpen(true);
    };

    const openPhotoModal = (index: number) => {
        setCurrentPhotoIndex(index);
        setPhotoModalOpen(true);
    };

    const closePhotoModal = () => {
        setPhotoModalOpen(false);
        // Refresh reposted photos when modal closes (in case user unreposted something)
        if (photoView === "reposted") {
            fetchRepostedPhotos();
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/get-user", {
                headers: {Authorization: `Bearer ${token}`}
            });
            const user = response.data;
            console.log(user)
            setUserId(user.id);
            setUsername(user.username);
            setFname(user.fname);
            setLname(user.lname);
            setFollowers(user.followers || 0);
            setFollowing(user.following || 0);
            setPosts(user.photos.length || 0);
            setAvatarUrl(user.avatar || "/stock-profile-pic.png");
            if (user.photos) setPhotos(user.photos.map((p: any) => ({id: p.id, url: p.url, photoTags: p.photoTags || [], user: p.user})));
        } catch (err: any) {
            console.error(err);
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

    useEffect(() => {
        fetchUserData();
    }, [token]);

    useEffect(() => {
        if (userId && photoView === "reposted") {
            fetchRepostedPhotos();
        }
    }, [userId, photoView]);

    const handleAvatarUpdate = async (newImage: string | File, tags?: string) => {
        if (modalFor === "avatar") {
            try {
                await axios.post(
                    "/api/update-avatar",
                    {avatar: newImage},
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                setAvatarUrl(newImage as string);
            } catch (err) {
                console.error("Failed to upload avatar", err);
            }
        } else if (modalFor === "photo") {
            if (newImage instanceof File) {
                const formData = new FormData();
                formData.append("photo", newImage);
                if (tags) formData.append("tags", tags);
                try {
                    await axios.post("/api/upload-photo", formData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    });
                    await fetchUserData();
                } catch (err) {
                    console.error("Failed to upload photo", err);
                }
            }
        }
        setModalOpen(false);
        setModalFor(null);
    };

    const handleDeletePhoto = async () => {
        if (!photoToDelete) return;
        try {
            await axios.delete(`/api/photo/${photoToDelete}`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            setPhotos(photos.filter((p) => p.id !== photoToDelete));
            setPosts((prev) => prev - 1);
        } catch (err) {
            console.error("Failed to delete photo", err);
        } finally {
            setConfirmOpen(false);
            setPhotoToDelete(null);
        }
    };

    const handleUnrepost = async (photoId: string) => {
        try {
            await axios.post(
                "/api/unrepost",
                { photoId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRepostedPhotos(repostedPhotos.filter((p) => p.id !== photoId));
        } catch (err) {
            console.error("Failed to unrepost photo", err);
        }
    };

    const displayedPhotos = photoView === "personal" ? photos : repostedPhotos;

    return (
        <>
            <div className="home-blurred-card d-flex flex-column align-items-center p-4 mb-4">
                <div className="profile-container">
                    <div className="profile-card">
                        <div className="profile-left">
                            <div className="avatar-wrapper" style={{position: "relative", width: 120, height: 120}}>
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="profile-pic"
                                    style={{width: "100%", height: "100%"}}
                                />
                                <button
                                    className="avatar-edit-btn"
                                    title="Change photo"
                                    onClick={() => openModal("avatar")}
                                >
                                    <PencilIcon/>
                                </button>
                            </div>
                            <h3 className="profile-name">{fname} {lname}</h3>
                            <span className="stats-label">{username}</span>
                        </div>

                        <div className="profile-right">
                            <div className="stats-item">
                                <span className="stats-value">{posts}</span>
                                <span className="stats-label">Posts</span>
                            </div>
                            <div
                                className="stats-item"
                                style={{cursor: "pointer"}}
                                onClick={() => setFollowersModalOpen(true)}
                            >
                                <span className="stats-value">{followers}</span>
                                <span className="stats-label">Followers</span>
                            </div>
                            <div
                                className="stats-item"
                                style={{cursor: "pointer"}}
                                onClick={() => setFollowingModalOpen(true)}
                            >
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
                    {photoView === "personal" && (
                        <div className="gallery-item add-photo" onClick={() => openModal("photo")}>
                            <span style={{fontSize: "2rem", fontWeight: "bold"}}>+</span>
                        </div>
                    )}
                    {displayedPhotos.map((photo, idx) => (
                        <div key={idx} className="gallery-item photo-item" onClick={() => openPhotoModal(idx)}
                             style={{position: "relative"}}
                        >
                            <img
                                src={photo.url}
                                alt={`Photo ${idx + 1}`}
                                style={{cursor: "pointer"}}
                            />
                            <button
                                className="delete-photo-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (photoView === "personal") {
                                        setPhotoToDelete(photo.id);
                                        setConfirmOpen(true);
                                    } else {
                                        handleUnrepost(photo.id);
                                    }
                                }}
                                title={photoView === "personal" ? "Delete photo" : "Remove repost"}
                            >
                                <X size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {modalOpen &&
                createPortal(
                    <ImageCropModal
                        isOpen={modalOpen}
                        updateAvatar={handleAvatarUpdate}
                        closeModal={() => {
                            setModalOpen(false);
                            setModalFor(null);
                        }}
                        forType={modalFor}
                    />,
                    document.body
                )
            }
            {photoModalOpen &&
                createPortal(
                    <PhotoModal
                        isOpen={photoModalOpen}
                        onClose={closePhotoModal}
                        photos={displayedPhotos}
                        initialIndex={currentPhotoIndex}
                        currentUserId={userId}
                    />,
                    document.body
                )
            }

            {confirmOpen &&
                createPortal(
                    <ConfirmModal
                        isOpen={confirmOpen}
                        title="Delete Photo"
                        message="Are you sure you want to delete this photo?"
                        onConfirm={handleDeletePhoto}
                        onCancel={() => setConfirmOpen(false)}
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

export default Profile;