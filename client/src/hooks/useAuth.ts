import { useState, useEffect } from 'react';

// Dummy user data for development
const DUMMY_USER = {
  sub: "auth0|dummy_user_123",
  email: "demo@example.com",
  name: "Demo User",
  given_name: "Demo",
  family_name: "User",
  picture: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  email_verified: true,
};

// Dummy token for API calls
const DUMMY_TOKEN = "dummy_jwt_token_for_development";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<typeof DUMMY_USER | null>(null);

  useEffect(() => {
    // Simulate loading and auto-login for dummy auth
    const timer = setTimeout(() => {
      setIsAuthenticated(true);
      setUser(DUMMY_USER);
      setIsLoading(false);
    }, 100); // Reduced from 500ms to 100ms for faster auth

    return () => clearTimeout(timer);
  }, []);

  const login = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(DUMMY_USER);
      setIsLoading(false);
    }, 500);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const getAccessToken = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Auth not ready yet, waiting...');
      // Wait a bit for auth to complete if it's still loading
      if (isLoading) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
    }
    return DUMMY_TOKEN;
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getAccessToken,
  };
}
