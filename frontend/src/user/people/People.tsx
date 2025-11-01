import React, { useState, useEffect } from "react";
import "../home-screen/HomeScreen.css"
import axios from "../../auth/CrossOrigin";
import { Search } from "lucide-react";
import "./People.css"
import UserProfile from "./UserProfile";

interface PeopleProps {
  token: string;
}

const People: React.FC<PeopleProps> = ({ token }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 0) {
        fetchUsers(query);
      } else {
        setUsers([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchUsers = async (searchTerm: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/search-users?query=${encodeURIComponent(searchTerm)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedUser) {
    return (
      <UserProfile
        token={token}
        username={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="home-blurred-card d-flex flex-column align-items-center p-4">
      <h2 className="mb-3">Find People</h2>

      {/* Search bar */}
      <div className="search-bar">
        <Search size={20} color="#ffffffff" className="search-icon" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="mt-4 w-100">
        {loading && <p>Loading...</p>}
        {!loading && users.length === 0 && query && <p>No users found.</p>}
        {!loading &&
          users.map((user) => (
            <div key={user.id} className="user-card" onClick={() => setSelectedUser(user.username)}>
              <img
                src={user.avatar || "/stock-profile-pic.png"}
                alt={user.username}
                className="user-avatar"
              />
              <div>
                <strong>{user.fname} {user.lname}</strong>
                <p className="text-dimmed">@{user.username}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default People;