import React, { useEffect, useState, useCallback } from "react";
import "../home-screen/HomeScreen.css";
import axios from "../../auth/CrossOrigin";
import PhotoModal from "../../common/PhotoModal";
import { createPortal } from "react-dom";
import "./Feed.css"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

interface FeedProps {
    token: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
}

type PhotoViewType = "random" | "following";

const Feed: React.FC<FeedProps> = ({ token }) => {
    const [photos, setPhotos] = useState<any[]>([]);
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [photoView, setPhotoView] = useState<PhotoViewType>("random");
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 0,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false
    });

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
            setUserId(response.data.id);
        } catch (err: any) {
            console.error("Failed to fetch user data:", err);
        }
    };

    // Fetchuj fotky za specificku stranku
    const fetchPhotosPage = useCallback(async (pageNum: number) => {
        try {
            if (pageNum === 1) {
                setInitialLoading(true);
            } else {
                setLoading(true);
            }

            const endpoint = photoView === "random" ? "/api/feed" : "/api/feed/following";

            console.log(`Fetching ${photoView} page ${pageNum}...`);

            const response = await axios.get(endpoint, {
                params: { page: pageNum },
                headers: { Authorization: `Bearer ${token}` }
            });

            const newPhotos = response.data.photos || [];
            const newPagination = response.data.pagination;

            console.log("Pagination info:", newPagination);
            console.log("New photos count:", newPhotos.length);

            // Ak je first page, replace, inak append
            if (pageNum === 1) {
                setPhotos(newPhotos);
            } else {
                setPhotos(prev => [...prev, ...newPhotos]);
            }

            setPagination(newPagination);
        } catch (err) {
            console.error("Error fetching photos:", err);
        } finally {
            setInitialLoading(false);
            setLoading(false);
        }
    }, [photoView, token]);

    // Ked sa zmeni photoView, reset a fetchuj stranku 1
    useEffect(() => {
        console.log("Photo view changed to:", photoView);
        setPhotos([]);
        setPagination({
            page: 0,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false
        });
        fetchPhotosPage(1);
    }, [photoView, fetchPhotosPage]);

    // Initial load
    useEffect(() => {
        fetchUserData();
    }, [token]);

    // Load more handler - volany ked user scrolluje dol
    const handleLoadMore = useCallback(() => {
        console.log("Loading more... Current page:", pagination.page);
        const nextPage = pagination.page + 1;
        fetchPhotosPage(nextPage);
    }, [pagination.page, fetchPhotosPage]);

    // Infinite scroll observer
    const observerTarget = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasNextPage: pagination.hasNextPage,
        isLoading: loading,
        threshold: 500
    });

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
                            disabled={initialLoading}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                background: photoView === "random" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                color: 'white',
                                fontWeight: photoView === "random" ? 600 : 400,
                                cursor: initialLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.9rem',
                                opacity: initialLoading ? 0.6 : 1
                            }}
                        >
                            Random
                        </button>
                        <button
                            onClick={() => setPhotoView("following")}
                            disabled={initialLoading}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                background: photoView === "following" ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                color: 'white',
                                fontWeight: photoView === "following" ? 600 : 400,
                                cursor: initialLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.9rem',
                                opacity: initialLoading ? 0.6 : 1
                            }}
                        >
                            Following
                        </button>
                    </div>
                </div>

                {/* Loading - First Load */}
                {initialLoading && <p className="text-center">Loading...</p>}

                {/* No photos */}
                {!initialLoading && photos.length === 0 && (
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

                {/* Loading - Load More */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <p>Loading more photos...</p>
                    </div>
                )}

                {/* Infinite Scroll Observer Target */}
                {pagination.hasNextPage && !loading && (
                    <div
                        ref={observerTarget}
                        style={{ height: "1px", visibility: "hidden" }}
                        aria-hidden="true"
                    />
                )}

                {/* End of content message */}
                {!loading && !pagination.hasNextPage && photos.length > 0 && (
                    <div style={{ textAlign: "center", padding: "20px", color: "rgba(255, 255, 255, 0.5)" }}>
                        <p>No more photos to load</p>
                    </div>
                )}
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