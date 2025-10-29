import React from "react";
import "../home-screen/HomeScreen.css"

interface FeedProps {
    message: string;
}

const Feed: React.FC<FeedProps> = ({ message }) => {
    return (
        <div className="home-blurred-card d-flex flex-column align-items-center p-4">
            <h2>Feed</h2>
            <p>{message}</p>
        </div>
    );
};

export default Feed;
