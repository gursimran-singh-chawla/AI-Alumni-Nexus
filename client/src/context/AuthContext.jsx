import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    setUser(data.user);
    return data.user;
  };

  const refreshMe = async () => {
    const data = await api.me();
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshMe }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
