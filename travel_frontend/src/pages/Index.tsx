
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingScreen from '@/components/OnboardingScreen';
import TripPlanning from '@/components/TripPlanning';
import TripResults from '@/components/TripResults';
import Navbar from '@/components/Navbar';
import LoginPage from '@/components/LoginPage';
import SignupPage from '@/components/SignupPage';
import ProfilePage from '@/components/ProfilePage';

const Index = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'planning' | 'results' | 'login' | 'signup' | 'profile'>('onboarding');
  const location = useLocation();

  useEffect(() => {
    // Check if we should show planning screen from navbar
    if (location.state?.showPlanning) {
      setCurrentScreen('planning');
    }

    // Check if we should show planning screen (when editing a trip)
    const showPlanningScreen = localStorage.getItem('showPlanningScreen');
    if (showPlanningScreen) {
      localStorage.removeItem('showPlanningScreen');
      setCurrentScreen('planning');
    }

    const handleShowTripResults = (event: CustomEvent) => {
      console.log('Trip data:', event.detail);
      setCurrentScreen('results');
    };

    window.addEventListener('showTripResults' as any, handleShowTripResults);
    
    return () => {
      window.removeEventListener('showTripResults' as any, handleShowTripResults);
    };
  }, [location]);

  const handleAuthClick = (type: 'login' | 'signup') => {
    setCurrentScreen(type);
  };

  const handleProfileClick = () => {
    setCurrentScreen('profile');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentScreen('onboarding');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return (
          <div>
            <Navbar 
              onAuthClick={handleAuthClick}
              onProfileClick={handleProfileClick}
              isAuthenticated={isAuthenticated}
            />
            <OnboardingScreen onComplete={() => setCurrentScreen('planning')} />
          </div>
        );
      case 'planning':
        return (
          <div>
            <Navbar 
              onAuthClick={handleAuthClick}
              onProfileClick={handleProfileClick}
              isAuthenticated={isAuthenticated}
            />
            <TripPlanning onBack={() => setCurrentScreen('onboarding')} />
          </div>
        );
      case 'results':
        return (
          <div>
            <Navbar 
              onAuthClick={handleAuthClick}
              onProfileClick={handleProfileClick}
              isAuthenticated={isAuthenticated}
            />
            <TripResults onBack={() => setCurrentScreen('planning')} />
          </div>
        );
      case 'login':
        return (
          <LoginPage
            onBack={() => setCurrentScreen('onboarding')}
            onSwitchToSignup={() => setCurrentScreen('signup')}
          />
        );
      case 'signup':
        return (
          <SignupPage
            onBack={() => setCurrentScreen('onboarding')}
            onSwitchToLogin={() => setCurrentScreen('login')}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            onBack={() => setCurrentScreen('onboarding')}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <div>
            <Navbar 
              onAuthClick={handleAuthClick}
              onProfileClick={handleProfileClick}
              isAuthenticated={isAuthenticated}
            />
            <OnboardingScreen onComplete={() => setCurrentScreen('planning')} />
          </div>
        );
    }
  };

  return renderScreen();
};

export default Index;
