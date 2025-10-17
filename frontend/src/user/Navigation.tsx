import React from "react";
import { Home, Users, User, LogOut } from "lucide-react";

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { name: "Feed", icon: <Home size={20} /> },
        { name: "People", icon: <Users size={20} /> },
        { name: "Profile", icon: <User size={20} /> },
        { name: "Logout", icon: <LogOut size={20} /> },
    ];

    return (
        <div className="home-blurred-card d-flex justify-content-around p-3 mt-4 mb-4">
            {tabs.map((tab) => (
                <button
                    key={tab.name}
                    className={`btn btn-link d-flex align-items-center gap-2 ${activeTab === tab.name ? "text-white fw-bold" : "text-white-50"
                        }`}
                    onClick={() => setActiveTab(tab.name)}
                >
                    {tab.icon}
                    {/* Text sa zobrazí len na väčších obrazovkách */}
                    <span className="d-none d-sm-inline">{tab.name}</span>
                </button>
            ))}
        </div>
    );
};

export default Navigation;
