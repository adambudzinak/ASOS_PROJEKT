import React from "react";
import axios from "../../auth/CrossOrigin";
import "../home-screen/HomeScreen.css"
import { useEffect, useState } from "react";
import PhotoModal from "../../common/PhotoModal";
import "./Profile.css"
import PencilIcon from "../../common/PencilIcon";
import { createPortal } from "react-dom";
import ImageCropModal from "../../common/UploadModal";

interface ProfileProps {
    token: string;
}

const Profile: React.FC<ProfileProps> = ({ token }) => {
    const [username, setUsername] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [followers, setFollowers] = useState<number>(0);
    const [following, setFollowing] = useState<number>(0);
    const [posts, setPosts] = useState<number>(0);

    const [avatarUrl, setAvatarUrl] = useState("/stock-profile-pic.png");
    const [modalOpen, setModalOpen] = useState(false);

    const [photos, setPhotos] = useState<string[]>([]);

    const [modalFor, setModalFor] = useState<"avatar" | "photo" | null>(null);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/get-user", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = response.data;
            setUsername(user.username);
            setFname(user.fname);
            setLname(user.lname);
            setFollowers(user.followers || 0);
            setFollowing(user.following || 0);
            setPosts(user.photos.length || 0);
            setAvatarUrl(user.avatar || "/stock-profile-pic.png");
            if (user.photos) setPhotos(user.photos.map((p: any) => p.url));
        } catch (err: any) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [token]);

    const handleAvatarUpdate = async (newImage: string | File) => {
        if (modalFor === "avatar") {
            try {
                await axios.post(
                    "/api/update-avatar",
                    { avatar: newImage },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAvatarUrl(newImage as string);
            } catch (err) {
                console.error("Failed to upload avatar", err);
            }
        } else if (modalFor === "photo") {
            if (newImage instanceof File) {
                const formData = new FormData();
                formData.append("photo", newImage);
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

    return (
        <>
            <div className="home-blurred-card d-flex flex-column align-items-center p-4 mb-4">
                <div className="profile-container">
                    <div className="profile-card">
                        <div className="profile-left">
                            <div className="avatar-wrapper" style={{ position: "relative", width: 120, height: 120 }}>
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="profile-pic"
                                    style={{ width: "100%", height: "100%" }}
                                />
                                <button
                                    className="avatar-edit-btn"
                                    title="Change photo"
                                    onClick={() => openModal("avatar")}
                                >
                                    <PencilIcon />
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
                    <div className="gallery-item add-photo" onClick={() => openModal("photo")}>
                        <span style={{ fontSize: "2rem", fontWeight: "bold" }}>+</span>
                    </div>
                    {photos.map((photo, idx) => (
                        <div key={idx} className="gallery-item" onClick={() => openPhotoModal(idx)}>
                            <img
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                style={{ cursor: "pointer" }}
                            />
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
                        photos={photos}
                        initialIndex={currentPhotoIndex}
                    />,
                    document.body
                )
            }
        </>
    );
};

export default Profile;