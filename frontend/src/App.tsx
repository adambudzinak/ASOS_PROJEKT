import React, { useState, useEffect } from "react";
import AuthScreen from "./index/AuthScreen";
import HomeScreen from "./user/home-screen/HomeScreen";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (token: string) => {
    setToken(token);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem("token");
  };

  return (
    <>
      {isLoggedIn && token ? (
        <HomeScreen token={token} onLogout={handleLogout}/>
      ) : (
        <AuthScreen
          onLogin={handleLogin}
        />
      )}
    </>
  );
};

export default App;
