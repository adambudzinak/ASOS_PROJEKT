import React, { useEffect, useState } from "react";
import "../home-screen/HomeScreen.css";
import axios from "../../auth/CrossOrigin";
import PhotoModal from "../../common/PhotoModal";
import { createPortal } from "react-dom";
import "./Feed.css"

interface FeedProps {
    token: string;
}

type PhotoViewType = "random" | "following";

const Feed: React.FC<FeedProps> = ({ token }) => {
    const [photos, setPhotos] = useState<any[]>([]);
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [photoView, setPhotoView] = useState<PhotoViewType>("random");

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
            setUserId(user.id);
        } catch (err: any) {
            console.error(err);
        }
    };

    const fetchPhotos = async (view: PhotoViewType) => {
        setLoading(true);
        try {
            const endpoint = view === "random" ? "/api/feed" : "/api/feed/following";
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhotos(response.data.photos || []);
        } catch (err) {
            console.error("Error fetching photos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos(photoView);
    }, [photoView]);

    useEffect(() => {
        fetchUserData();
    }, [token]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("sk-SK", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };


    return (
        <>
            <div className="home-blurred-card feed mb-4">

                {/* Toggle Buttons */}
                <div style={{ display: "flex", justifyContent: "center" }}>
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
                            onClick={() => setPhotoView("random")}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                background: photoView === "random" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                color: 'white',
                                fontWeight: photoView === "random" ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.9rem'
                            }}
                        >
                            Random
                        </button>
                        <button
                            onClick={() => setPhotoView("following")}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                background: photoView === "following" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                color: 'white',
                                fontWeight: photoView === "following" ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.9rem'
                            }}
                        >
                            Following
                        </button>
                    </div>
                </div>
                
                {/* Loading */}
                {loading && <p>Loading...</p>}

                {/* No photos */}
                {!loading && photos.length === 0 && (
                    <p className="text-center">No photos available</p>
                )}

                <div className="container">
                    <div className="row">
                        {photos.map((photo, idx) => (
                            <div
                                key={photo.id}
                                className="col-12 col-md-6 mb-4 d-flex justify-content-center feed-item"
                                onClick={() => openPhotoModal(idx)}
                            >
                                <div className="photo-card w-100">
                                    {/* PHOTO */}
                                    <img
                                        src={photo.url}
                                        alt="feed"
                                        className="img-fluid"
                                        style={{ width: "100%", height: "auto" }}
                                    />

                                    {/* USER INFO */}
                                    <div className="d-flex justify-content-between align-items-center mt-2 user-info">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={photo.user.avatar || "/stock-profile-pic.png"}
                                                alt="avatar"
                                                className="rounded-circle"
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    objectFit: "cover",
                                                    marginRight: "10px"
                                                }}
                                            />
                                            <span>
                                                {photo.user.fname} {photo.user.lname}
                                            </span>
                                        </div>

                                        {/* DATE */}
                                        <span className="small feed-date">
                                            {formatDate(photo.createdAt)}
                                        </span>

                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {photoModalOpen &&
                createPortal(
                    <PhotoModal
                        isOpen={photoModalOpen}
                        onClose={closePhotoModal}
                        photos={photos}
                        initialIndex={currentPhotoIndex}
                        currentUserId={userId}
                    />,
                    document.body
                )
            }
        </>
    );
};

export default Feed;
