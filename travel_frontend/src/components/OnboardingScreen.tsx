
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Brain
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const agents = [
    {
      name: "Travel Planner",
      icon: MapPin,
      description: "Plans your perfect itinerary",
      color: "text-ai-primary"
    },
    {
      name: "Local Expert", 
      icon: Users,
      description: "Finds authentic local experiences",
      color: "text-ai-secondary"
    },
    {
      name: "Smart Assistant",
      icon: Brain,
      description: "Handles bookings and logistics",
      color: "text-ai-tertiary"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Call-to-action button at top of page above the cards */}
        <div className="flex justify-center">
          {isAuthenticated ? (
            <Button onClick={() => navigate('/', { state: { showPlanning: true } })} className="ai-button-primary px-8 py-6 text-lg">
              Open AI Planner
            </Button>
          ) : (
            <Button onClick={onComplete} className="ai-button-primary px-8 py-6 text-lg">
              Get Started
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="space-y-6 animate-slide-in-up">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ai-primary via-ai-secondary to-ai-tertiary flex items-center justify-center ai-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-hero text-4xl md:text-6xl lg:text-7xl mb-6">
            Your AI Travel
            <span className="block bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-tertiary bg-clip-text text-transparent">
              Dream Team
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
            Meet your personal AI agents who work together to create 
            <span className="text-ai-primary font-semibold"> extraordinary travel experiences</span> 
            tailored just for you
          </p>
        </div>

        {/* AI Agents Grid */}
        <div className="grid md:grid-cols-3 gap-8 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
          {agents.map((agent, index) => {
            const AgentIcon = agent.icon;
            
            return (
              <div
                key={agent.name}
                className="glass-card p-8 group interactive-hover animate-fade-in"
                style={{ animationDelay: `${600 + index * 200}ms` }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-background-secondary to-background-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AgentIcon className={`w-8 h-8 ${agent.color} group-hover:animate-pulse`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">
                    {agent.name}
                  </h3>
                  
                  <p className="text-foreground-secondary text-center">
                    {agent.description}
                  </p>
                  
                  <div className="flex space-x-1 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${agent.color.replace('text-', 'bg-')} animate-pulse`}
                        style={{ animationDelay: `${i * 0.5}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 text-left animate-slide-in-up" style={{ animationDelay: '1200ms' }}>
          <div className="glass-card-tertiary p-6">
            <h4 className="font-semibold text-foreground mb-2">Real-Time Collaboration</h4>
            <p className="text-sm text-foreground-muted">Your AI agents work together, sharing insights and optimizing your itinerary in real-time.</p>
          </div>
          
          <div className="glass-card-tertiary p-6">
            <h4 className="font-semibold text-foreground mb-2">Personalized Experiences</h4>
            <p className="text-sm text-foreground-muted">Every recommendation is tailored to your preferences, budget, and travel style.</p>
          </div>
          
          <div className="glass-card-tertiary p-6">
            <h4 className="font-semibold text-foreground mb-2">Smart Optimization</h4>
            <p className="text-sm text-foreground-muted">Automatic route optimization, budget tracking, and local insights for the perfect trip.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
