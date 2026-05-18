import { createContext, useContext, useState, useEffect } from "react";
import { getMe, normalizeUser } from "@/services/userService";
import { getMySentExchangeRequests, getMyReceivedExchangeRequests } from "@/services/exchangeRequestsService";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const fetchUserData = async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      setIsUserLoading(false);
      return;
    }

    try {
      // 1. Fetch current user
      const uData = await getMe();
      setCurrentUser(normalizeUser(uData));

      try {
        const [sent, received] = await Promise.all([
          getMySentExchangeRequests(),
          getMyReceivedExchangeRequests(),
        ]);
        const allRequests = [...(sent || []), ...(received || [])];
        console.log("✅ Connection requests fetched:", allRequests);
        setConnectionRequests(allRequests);
      } catch (requestError) {
        console.error("❌ Failed to fetch connection requests:", requestError);
        setConnectionRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch user context:", error);
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const refreshUserData = async () => {
   await fetchUserData();
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, connectionRequests, isUserLoading, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);