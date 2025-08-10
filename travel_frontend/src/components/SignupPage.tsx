
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface SignupPageProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSwitchToLogin }) => {
  const { signup, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (formData.password !== formData.confirm_password) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      await signup(formData);
      toast({ title: 'Account created', description: 'Please sign in to continue.' });
      // After successful signup, direct user to login page
      onSwitchToLogin();
    } catch (error) {
      // Error is handled by the AuthContext
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
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
            <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
            <p className="mt-2 text-foreground-muted">Start planning your dream trips</p>
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

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                  placeholder="Enter your email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                  placeholder="Enter your email"
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
                  placeholder="Create a password"
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

              <div className="relative">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-7"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-foreground-muted" />
                  ) : (
                    <Eye className="h-4 w-4 text-foreground-muted" />
                  )}
                </button>
              </div>
            </div>

            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error || validationError}
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="ai-button-primary w-full py-3"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>

            <div className="text-center">
              <span className="text-foreground-muted">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-ai-primary hover:text-ai-secondary font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
