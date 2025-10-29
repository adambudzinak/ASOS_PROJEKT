import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ImageCropper from "./ImageCropper";
import "./Modal.css";
import "../index.css"

interface ImageCropModalProps {
    isOpen: boolean;
    updateAvatar: (image: string | File) => void;
    closeModal: () => void;
    forType?: "avatar" | "photo" | null;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    updateAvatar,
    closeModal,
    forType
}) => {
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="imagecrop-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    />

                    <motion.div
                        className="fixed z-50 blurred-card p-5 imagecrop-modal"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        transformTemplate={({ x, y, scale }) => `translate(-50%, -50%) scale(${scale})`}
                        onClick={(e) => e.stopPropagation()}

                    >
                        <button
                            type="button"
                            className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                            aria-label="Close"
                            onClick={closeModal}
                        />
                        <h4 className="text-center mt-2 mb-4">Upload picture</h4>
                        <div className="modal-content-scroll d-flex justify-content-center align-items-center w-100">
                            <ImageCropper updateAvatar={updateAvatar} closeModal={closeModal} forType={forType}/>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ImageCropModal;
