import React, {useEffect, useState, useCallback, useRef} from "react";
import "../home-screen/HomeScreen.css";
import axios from "../../auth/CrossOrigin";
import PhotoModal from "../../common/PhotoModal";
import { createPortal } from "react-dom";
import "./Feed.css"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { X, Search } from "lucide-react";

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

interface Tag {
    id: string;
    name: string;
    photoCount: number;
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
    const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTags, setShowTags] = useState(false);

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 0,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false
    });

    const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "all" | "1y">("all");
    const searchInputRef = useRef<HTMLDivElement>(null);

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

    const fetchTrendingTags = async () => {
        try {
            const response = await axios.get("/api/feed/trending-tags", {
                params: { timeRange },
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrendingTags(response.data.tags || []);
        } catch (err: any) {
            console.error("Failed to fetch trending tags:", err);
        }
    };

    const fetchPhotosPage = useCallback(async (pageNum: number) => {
        try {
            if (pageNum === 1) {
                setInitialLoading(true);
            } else {
                setLoading(true);
            }

            const endpoint = photoView === "random" ? "/api/feed" : "/api/feed/following";

            const searchParam = selectedTags.length > 0 ? selectedTags[0] : "";

            console.log(`Fetching ${photoView} page ${pageNum} with search: "${searchParam}"...`);

            const response = await axios.get(endpoint, {
                params: {
                    page: pageNum,
                    search: searchParam
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            const newPhotos = response.data.photos || [];
            const newPagination = response.data.pagination;

            console.log("Pagination info:", newPagination);
            console.log("New photos count:", newPhotos.length);

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
    }, [photoView, token, selectedTags]);

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

    useEffect(() => {
        console.log("Selected tags changed:", selectedTags);
        setPhotos([]);
        setPagination({
            page: 0,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false
        });
        fetchPhotosPage(1);
    }, [selectedTags, fetchPhotosPage]);

    useEffect(() => {
        fetchUserData();
    }, [token]);

    useEffect(() => {
        if (showTags) {
            fetchTrendingTags();
        }
    }, [timeRange, showTags]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowTags(false);
            }
        };

        if (showTags) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showTags]);

    const handleLoadMore = useCallback(() => {
        console.log("Loading more... Current page:", pagination.page);
        const nextPage = pagination.page + 1;
        fetchPhotosPage(nextPage);
    }, [pagination.page, fetchPhotosPage]);

    const observerTarget = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasNextPage: pagination.hasNextPage,
        isLoading: loading,
        threshold: 500
    });

    const clearSearch = () => {
        setSelectedTags([]);
        setShowTags(false);
    };

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

                {/* Search Bar */}
                <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ position: "relative" }} ref={searchInputRef}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "20px",
                            padding: "8px 15px",
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            <Search size={18} color="rgba(255,255,255,0.6)" />
                            <input
                                type="text"
                                className="feed-search-input"
                                placeholder="Search by tags"
                                value={selectedTags.join("")}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase().trim();
                                    if (value === "") {
                                        setSelectedTags([]);
                                    } else {
                                        setSelectedTags([value]);
                                    }
                                }}
                                onFocus={() => setShowTags(true)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "white",
                                    outline: "none",
                                    width: "100%",
                                    fontSize: "0.95rem"
                                }}
                            />
                            {selectedTags.length > 0 && (
                                <button
                                    onClick={() => {
                                        clearSearch();
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "rgba(255,255,255,0.7)",
                                        padding: "0 5px",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Tags Suggestions Dropdown */}
                        {showTags && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: "0",
                                right: "0",
                                background: "rgba(0, 0, 0, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                marginTop: "8px",
                                zIndex: 1000,
                                maxHeight: "400px",
                                overflowY: "auto",
                                padding: "10px"
                            }}>
                                {/* Time Range Buttons */}
                                <div style={{
                                    display: "flex",
                                    gap: "8px",
                                    marginBottom: "10px",
                                    padding: "0 5px"
                                }}>
                                    <button
                                        onClick={() => setTimeRange("1d")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            background: timeRange === "1d" ? "rgba(100, 200, 255, 0.3)" : "transparent",
                                            color: timeRange === "1d" ? "rgba(100, 200, 255, 1)" : "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: timeRange === "1d" ? 600 : 400,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (timeRange !== "1d") {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (timeRange !== "1d") {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        1 day
                                    </button>
                                    <button
                                        onClick={() => setTimeRange("7d")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            background: timeRange === "7d" ? "rgba(100, 200, 255, 0.3)" : "transparent",
                                            color: timeRange === "7d" ? "rgba(100, 200, 255, 1)" : "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: timeRange === "7d" ? 600 : 400,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (timeRange !== "7d") {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (timeRange !== "7d") {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        7 days
                                    </button>
                                    <button
                                        onClick={() => setTimeRange("30d")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            background: timeRange === "30d" ? "rgba(100, 200, 255, 0.3)" : "transparent",
                                            color: timeRange === "30d" ? "rgba(100, 200, 255, 1)" : "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: timeRange === "30d" ? 600 : 400,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (timeRange !== "30d") {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (timeRange !== "30d") {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        1 month
                                    </button>
                                    <button
                                        onClick={() => setTimeRange("1y")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            background: timeRange === "1y" ? "rgba(100, 200, 255, 0.3)" : "transparent",
                                            color: timeRange === "1y" ? "rgba(100, 200, 255, 1)" : "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: timeRange === "1y" ? 600 : 400,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (timeRange !== "1y") {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (timeRange !== "1y") {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        1 year
                                    </button>
                                    <button
                                        onClick={() => setTimeRange("all")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            background: timeRange === "all" ? "rgba(100, 200, 255, 0.3)" : "transparent",
                                            color: timeRange === "all" ? "rgba(100, 200, 255, 1)" : "rgba(255,255,255,0.7)",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: timeRange === "all" ? 600 : 400,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (timeRange !== "all") {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (timeRange !== "all") {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        All time
                                    </button>
                                </div>

                                <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

                                <p style={{ color: "rgba(255,255,255,0.6)", padding: "10px 5px", margin: "0", fontSize: "0.85rem" }}>
                                    Trending tags:
                                </p>
                                {trendingTags.length === 0 ? (
                                    <p style={{ color: "rgba(255,255,255,0.5)", padding: "10px", textAlign: "center", margin: "0" }}>
                                        No tags available
                                    </p>
                                ) : (
                                    trendingTags.slice(0, 10).map(tag => (
                                        <div
                                            key={tag.id}
                                            onClick={() => {
                                                setSelectedTags([tag.name]);
                                                setShowTags(false);
                                            }}
                                            style={{
                                                padding: "10px 12px",
                                                margin: "5px 0",
                                                borderRadius: "8px",
                                                background: "rgba(255, 255, 255, 0.05)",
                                                border: "1px solid transparent",
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                transition: "all 0.2s",
                                                color: "white"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                            }}
                                        >
                                            <span>#{tag.name}</span>
                                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                                                {tag.photoCount}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

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
                    <p className="text-center" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        {selectedTags.length > 0
                            ? `No photos found with tag "${selectedTags[0]}"`
                            : "No photos available"}
                    </p>
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
