import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Check if user is logged in initially
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me", { withCredentials: true });
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);
  //login
  const login = async (username, password) => {
    const res = await axios.post(
      "/api/auth/login",
      { username, password },
      { withCredentials: true }
    );
    setUser(res.data.user);
    
    return res.data;
  };
  //register
  const register = async (username,name, email, password) => {
    const res=await axios.post("/api/auth/register", {username, name, email, password}, { withCredentials: true });
    setUser(res.data.user);
    return res.data;
  };
  //logout
  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, login,register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
