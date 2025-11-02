import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../auth/CrossOrigin";
import "./Modal.css";

interface User {
    id: string;
    username: string;
    fname: string;
    lname: string;
    avatar: string | null;
}

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: "followers" | "following";
    token: string;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
                                                           isOpen,
                                                           onClose,
                                                           userId,
                                                           type,
                                                           token
                                                       }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const endpoint = type === "followers"
                ? `/api/followers/${userId}`
                : `/api/following/${userId}`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(response.data[type] || []);
        } catch (err) {
            console.error(`Failed to fetch ${type}`, err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Blurred background */}
                    <motion.div
                        className="fixed inset-0 z-40"
                        style={{
                            background: "rgba(0, 0, 0, 0.69)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal window */}
                    <motion.div
                        className="fixed z-50 blurred-card p-4"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            maxWidth: "500px",
                            width: "90%",
                            maxHeight: "70vh",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                        initial={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Close button */}
                        <button
                            className="position-absolute top-0 end-0 m-3 btn-close btn-close-white"
                            onClick={onClose}
                            aria-label="Close"
                        />

                        {/* Header */}
                        <h3 className="text-white text-center mb-3">
                            {type === "followers" ? "Followers" : "Following"}
                        </h3>

                        {/* Users list */}
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {loading && (
                                <p className="text-center text-white-50">Loading...</p>
                            )}

                            {!loading && users.length === 0 && (
                                <p className="text-center text-white-50">
                                    No {type === "followers" ? "followers" : "following"} yet
                                </p>
                            )}

                            {!loading && users.map((user) => (
                                <div
                                    key={user.id}
                                    className="d-flex align-items-center gap-3 p-2 mb-2"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                    }}
                                >
                                    <img
                                        src={user.avatar || "/stock-profile-pic.png"}
                                        alt={user.username}
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "50%",
                                            objectFit: "cover"
                                        }}
                                    />
                                    <div>
                                        <p className="mb-0 text-white fw-bold">
                                            {user.fname} {user.lname}
                                        </p>
                                        <p className="mb-0 text-white-50 small">
                                            @{user.username}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FollowersModal;