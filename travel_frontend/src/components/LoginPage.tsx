
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onBack: () => void;
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSwitchToSignup }) => {
  const { login, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(formData);
      // Login successful - the AuthContext will handle the state update
      // You can add navigation logic here if needed
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Button
              onClick={onBack}
              className="ai-button-secondary mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-foreground-muted">Sign in to your account</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                  placeholder="Enter your username"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-7"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-foreground-muted" />
                  ) : (
                    <Eye className="h-4 w-4 text-foreground-muted" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button type="button" className="text-sm text-ai-primary hover:text-ai-secondary">
                Forgot your password?
              </button>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="ai-button-primary w-full py-3"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-center">
              <span className="text-foreground-muted">Don't have an account? </span>
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-ai-primary hover:text-ai-secondary font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
