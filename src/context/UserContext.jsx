import { useState, useEffect, useCallback, useRef } from "react";
import { getMe, normalizeUser } from "@/services/userService";
import { getMySentExchangeRequests, getMyReceivedExchangeRequests } from "@/services/exchangeRequestsService";
import { UserContext } from "./userSessionContext";

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const requestVersion = useRef(0);

  const refreshUserData = useCallback(async ({ silent = false } = {}) => {
    const version = ++requestVersion.current;
    if (!silent) setIsUserLoading(true);
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      setCurrentUser(null);
      setConnectionRequests([]);
      setIsUserLoading(false);
      return null;
    }

    try {
      // 1. Fetch current user
      const uData = await getMe();
      if (requestVersion.current !== version || localStorage.getItem('jwt_token') !== token) return null;
      setCurrentUser(normalizeUser(uData));

      try {
        const [sent, received] = await Promise.all([
          getMySentExchangeRequests(),
          getMyReceivedExchangeRequests(),
        ]);
        const allRequests = [...(sent || []), ...(received || [])];
        if (requestVersion.current !== version) return null;
        setConnectionRequests(allRequests);
      } catch (requestError) {
        console.error("Failed to fetch connection requests:", requestError);
        if (requestVersion.current === version) setConnectionRequests([]);
      }
      if (requestVersion.current !== version || localStorage.getItem('jwt_token') !== token) return null;
      return uData;
    } catch (error) {
      if (requestVersion.current !== version) return null;
      console.error("Failed to fetch user context:", error);
      if (error.response?.status === 401) {
        setCurrentUser(null);
        setConnectionRequests([]);
      }
      return null;
    } finally {
      if (requestVersion.current === version) setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
    const expireSession = () => {
      requestVersion.current += 1;
      setCurrentUser(null);
      setConnectionRequests([]);
      setIsUserLoading(false);
    };
    const syncSession = (event) => {
      if (event.key !== 'jwt_token') return;
      if (event.newValue) refreshUserData();
      else expireSession();
    };
    window.addEventListener('auth:expired', expireSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('auth:expired', expireSession);
      window.removeEventListener('storage', syncSession);
    };
  }, [refreshUserData]);

  const logout = () => {
    requestVersion.current += 1;
    localStorage.removeItem('jwt_token');
    setCurrentUser(null);
    setConnectionRequests([]);
    setIsUserLoading(false);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, connectionRequests, isUserLoading, refreshUserData, logout }}>
      {children}
    </UserContext.Provider>
  );
};
