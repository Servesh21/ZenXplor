import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BACKEND_URL, AGENT_URL } from "../api";

export interface User {
  id?: number;
  username: string;
  email: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount and hydrate user state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/check-auth`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            // Push token to local agent (non-blocking)
            if (data.token) {
              fetch(`${AGENT_URL}/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jwt_token: data.token, backend_url: BACKEND_URL }),
              }).catch(() => console.log("Agent not running — token push skipped."));
            }
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Refresh token periodically
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/check-auth`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.token) {
            fetch(`${AGENT_URL}/auth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jwt_token: data.token, backend_url: BACKEND_URL }),
            }).catch(() => {});
          }
        }
      } catch {
        // Silent fail
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
