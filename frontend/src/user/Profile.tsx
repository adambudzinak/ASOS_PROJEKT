import React from "react";
import axios from "../auth/CrossOrigin";
import "./HomeScreen.css"
import { useEffect, useState } from "react";

interface ProfileProps {
    token: string;
}

const Profile: React.FC<ProfileProps> = ({ token }) => {

    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/get-user", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFname(response.data.user.fname);
                setLname(response.data.user.lname);
            } catch (err: any) {
                console.error(err);
            }
        };
        fetchData();
    }, [token]);

    return (
        <div className="home-blurred-card d-flex flex-column align-items-center p-4">
            <h2>Profile</h2>
            <p>{fname} {lname}</p>
        </div>
    );
};

export default Profile;