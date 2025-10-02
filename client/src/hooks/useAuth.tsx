import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface AuthContextType {
  user: typeof DUMMY_USER | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<typeof DUMMY_USER | null>(null);

  useEffect(() => {
    // Check if user was previously authenticated
    const wasAuthenticated = localStorage.getItem('vortic_auth') === 'true';
    
    if (wasAuthenticated) {
      // Verify with backend
      fetch('/api/auth/me')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setIsAuthenticated(true);
            setUser(data);
          } else {
            localStorage.removeItem('vortic_auth');
          }
        })
        .catch(() => {
          localStorage.removeItem('vortic_auth');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        localStorage.setItem('vortic_auth', 'true');
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('vortic_auth');
  };

  const getAccessToken = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Auth not ready yet, waiting...');
      if (isLoading) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
    }
    return DUMMY_TOKEN;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
