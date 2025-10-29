import React, { useState } from "react";
import "./AuthScreen.css";
import "../index.css"
import Modal from "../common/ResponseModal.tsx";
import axios from "../auth/CrossOrigin.tsx";

interface AuthScreenProps {
    onLogin: (token: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalText, setModalText] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalButtonText, setModalButtonText] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && password !== confirmPassword) {
            setModalContent("Passwords do not match! Make sure that password and confirm password have the same value.", "ERROR", "GOT IT!")
            setModalOpen(true);
            return;
        } else if (!isLogin && (password.length < 5 || confirmPassword.length < 5)) {
            setModalContent("Password must be at least 6 characters long.", "ERROR", "GOT IT!")
            setModalOpen(true);
            return;
        } else if (!isLogin && (fname.length < 3 || fname.length > 20)) {
            setModalContent("First name must be at least 3 characters long, but no more than 20.", "ERROR", "GOT IT!")
            setModalOpen(true);
            return;
        } else if (!isLogin && (lname.length < 3 || lname.length > 20)) {
            setModalContent("Last name must be at least 3 characters long, but no more than 20.", "ERROR", "GOT IT!")
            setModalOpen(true);
            return;
        }

        let data;

        try {
            if (isLogin) {
                data = {
                    username,
                    password
                };
                const response = await axios.post("/sign-in", data);
                console.log("Server response:", response.data);
                const token = response.data.token;
                onLogin(token);
            } else {
                data = {
                    username,
                    password,
                    fname,
                    lname
                }
                const response = await axios.post("/sign-up", data);
                console.log("Server response:", response.data);

                setModalContent("Registration successful!", "SUCCESS", "GOT IT!");
                setModalOpen(true);
                toggleAuthMode();
            }
        } catch (error: any) {
            console.log(error)
            setModalContent(
                error.response?.data?.message || error.response?.data?.errors?.map((err: any) => err.msg).join(' ') || "Something went wrong :(",
                "ERROR",
                "GOT IT!"
            );
            setModalOpen(true);
        }
    };

    const setModalContent = (modalText: string, modalTitle: string, modalButtonText: string) => {
        setModalText(modalText);
        setModalTitle(modalTitle);
        setModalButtonText(modalButtonText);
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setUsername("");
        setFname("");
        setLname("");
        setPassword("");
        setConfirmPassword("");
    };

    return (
        <div className="auth-background d-flex justify-content-center align-items-center vh-100 flex-column">
            <div className="blurred-card p-4 mb-4 text-center">
                <h1>Welcome to InstaLite</h1>
                <p>Your minimalist Instagram experience. Share photos, follow friends, and explore content effortlessly.</p>
            </div>

            <div className="blurred-card p-4">
                <h2 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="John"
                                    value={fname}
                                    onChange={(e) => setFname(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Doe"
                                    value={lname}
                                    onChange={(e) => setLname(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div className="mb-3">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="glass-button w-100">
                        {isLogin ? "Login" : "Register"}
                    </button>
                </form>
                <div className="text-center mt-3">
                    {isLogin ? (
                        <p>
                            Don't have an account?{" "}
                            <span className="link-text" onClick={toggleAuthMode}>
                                Register
                            </span>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <span className="link-text" onClick={toggleAuthMode}>
                                Login
                            </span>
                        </p>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                text={modalText}
                buttonText={modalButtonText}
                onButtonClick={() => {
                    setModalOpen(false);
                }}
            />

        </div>
    );
};

export default AuthScreen;
