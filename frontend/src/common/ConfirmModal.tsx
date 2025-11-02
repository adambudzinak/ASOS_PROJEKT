import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Modal.css";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* blurred background */}
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
                        onClick={onCancel}
                    />

                    {/* Modal window */}
                    <motion.div
                        className="fixed z-50 blurred-card p-5"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                        initial={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Close button */}
                        <button
                            className="position-absolute top-0 end-0 m-3 btn-close btn-close-white"
                            onClick={onCancel}
                            aria-label="Close"
                        ></button>

                        {/* Content */}
                        <h2 className="text-white text-center mb-3">{title}</h2>
                        <p className="text-white-50 text-center mb-4">{message}</p>

                        {/* Action buttons */}
                        <div className="d-flex justify-content-center gap-3">
                            <button
                                onClick={onConfirm}
                                className="glass-button w-100"
                                style={{ maxWidth: "120px" }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={onCancel}
                                className="glass-button w-100"
                                style={{
                                    maxWidth: "120px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
