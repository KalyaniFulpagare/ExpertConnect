import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from "./storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  const applySession = ({ token, user }) => {
    setStoredSession({ token, user });
    setCurrentUser(user);
  };

  const clearSession = () => {
    clearStoredSession();
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setStoredSession({
        token: getStoredToken(),
        user: response.data.user
      });
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    refreshUser()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    applySession(response.data);
    return response.data.user;
  };

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    applySession(response.data);
    return response.data.user;
  };

  const logout = () => {
    clearSession();
  };

  const updateProfile = async (payload) => {
    const response = await api.patch("/auth/me", payload);
    setStoredSession({
      token: getStoredToken(),
      user: response.data.user
    });
    setCurrentUser(response.data.user);
    return response.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        loading,
        login,
        logout,
        refreshUser,
        signup,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
