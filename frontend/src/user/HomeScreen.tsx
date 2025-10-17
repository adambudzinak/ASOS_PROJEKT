import React, { useEffect, useState } from "react";
import axios from "../auth/CrossOrigin";
import Navigation from "./Navigation";
import "./HomeScreen.css"
import Feed from "./Feed";
import People from "./People";
import Profile from "./Profile";

interface HomeScreenProps {
    token: string;
    onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ token, onLogout }) => {
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("Feed");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/protected", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage(response.data.message);
            } catch (err: any) {
                console.error(err);
                setMessage(err.response?.data?.message || "Access denied");
            }
        };
        fetchData();
    }, [token]);

    const renderContent = () => {
        switch (activeTab) {
            case "Feed":
                return <Feed message={message} />;
            case "Profile":
                return <Profile />;
            case "People":
                return <People />;
            case "Logout":
                onLogout();
                return
            default:
                return <Feed message={message} />;
        }
    };

    return (
        <div className="home-background d-flex vh-100 flex-column align-items-center">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            {renderContent()}
        </div>

    );
};

export default HomeScreen;
