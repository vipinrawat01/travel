
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff, User, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, onLogout }) => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update profile data (excluding password fields)
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
      };
      
      await updateUserProfile(updateData);
      
      setIsEditing(false);
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogout = () => {
    // Supabase logout will be implemented here
    console.log('Logging out...');
    onLogout();
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
            <div className="w-20 h-20 bg-ai-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Your Profile</h2>
            <p className="mt-2 text-foreground-muted">
              {user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user?.username || 'Manage your account settings'
              }
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    disabled={!isEditing}
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary ${!isEditing ? 'opacity-60' : ''}`}
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
                    disabled={!isEditing}
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  disabled={!isEditing}
                  value={profileData.phone_number}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary ${!isEditing ? 'opacity-60' : ''}`}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled={true} // Email usually can't be changed
                  value={profileData.email}
                  className="appearance-none relative block w-full px-3 py-3 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background opacity-60"
                />
                <p className="text-xs text-foreground-muted mt-1">Email cannot be changed</p>
              </div>

              {isEditing && (
                <>
                  <div className="relative">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center mt-7"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-foreground-muted" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileData.newPassword}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center mt-7"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-foreground-muted" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={profileData.confirmPassword}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border rounded-md placeholder-foreground-muted text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ai-primary focus:border-ai-primary"
                      placeholder="Confirm new password"
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
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="ai-button-primary flex-1"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLogout}
                    className="ai-button-secondary flex-1 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="ai-button-primary flex-1"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      }));
                    }}
                    className="ai-button-secondary flex-1"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
