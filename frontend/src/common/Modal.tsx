import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Modal.css"

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    buttonText: string;
    onButtonClick: () => void;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    text,
    buttonText,
    onButtonClick
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
                            WebkitBackdropFilter: "blur(8px)"
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal window */}
                    <motion.div
                        className="fixed z-50 blurred-card p-5"
                        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                        initial={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Close button */}
                        <button
                            className="position-absolute top-0 end-0 m-3 btn-close btn-close-white"
                            onClick={onClose}
                            aria-label="Close">
                        </button>

                        {/* Content */}
                        <h2 className="text-white text-center mb-3">{title}</h2>
                        <p className="text-white-50 text-center mb-4">{text}</p>

                        {/* Action button */}
                        <button
                            onClick={onButtonClick}
                            className="glass-button w-100"
                        >
                            {buttonText}
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
