import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserProfile, LoginData, SignupData } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const loadUserProfile = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getUserProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // If token is invalid, clear it
      authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const login = async (credentials: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.login(credentials);
      await loadUserProfile();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.signup(userData);
      await loadUserProfile();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      authService.clearAuth();
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      setError(null);
      const updatedProfile = await authService.updateUserProfile(profileData);
      setUser(updatedProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUserProfile,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
