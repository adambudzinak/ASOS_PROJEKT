import { createPortal } from "react-dom";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Modal.css";

interface PhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: string[];
    initialIndex: number;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ isOpen, onClose, photos, initialIndex }) => {

    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* blurred background */}
                    <motion.div
                        className="fixed inset-0 z-40"
                        style={{
                            background: "rgba(0, 0, 0, 0.69)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)"
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* modal image container */}
                    <motion.div
                        className="fixed z-50 blurred-card imageview-modal"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        transformTemplate={({ x, y, scale }) => `translate(-50%, -50%) scale(${scale})`}
                        onClick={e => e.stopPropagation()}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignContent: "center",
                            maxWidth: "40vw",
                            maxHeight: "80vh",
                            height: "80vh"
                        }}
                    >
                        <button
                            className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                            onClick={onClose}
                            aria-label="Close"
                        />
                        <button
                            onClick={prevPhoto}
                            style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "2rem",
                                color: "white",
                                background: "none",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronLeft color="white" size={36} />
                        </button>
                        <button
                            onClick={nextPhoto}
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "2rem",
                                color: "white",
                                background: "none",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronRight color="white" size={36} />
                        </button>
                        <img
                            src={photos[currentIndex]}
                            alt={`Photo ${currentIndex + 1}`}
                            style={{
                                objectFit: "contain",
                            }}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PhotoModal;
