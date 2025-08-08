
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, MapPin, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onAuthClick: (type: 'login' | 'signup') => void;
  onProfileClick: () => void;
  isAuthenticated?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick, onProfileClick, isAuthenticated = false }) => {
  const navigate = useNavigate();

  const handleMyTripsClick = () => {
    navigate('/my-trips');
  };

  const handlePlannerClick = () => {
    // Navigate to trip planning page
    navigate('/', { state: { showPlanning: true } });
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-ai-primary">TravelAI</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleMyTripsClick}
              className="flex items-center space-x-2"
            >
              <MapPin className="w-4 h-4" />
              <span>My Trips</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handlePlannerClick}
              className="flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>AI Planner</span>
            </Button>

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => onAuthClick('login')}
                >
                  Login
                </Button>
                <Button
                  onClick={() => onAuthClick('signup')}
                  className="ai-button-primary"
                >
                  Sign Up
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={onProfileClick}
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
