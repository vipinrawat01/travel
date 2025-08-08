
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Clock, Star, DollarSign, Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Attraction {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: string;
  rating: number;
  distance: string;
  description: string;
  bestTime: string;
}

interface AttractionsResultsProps {
  onAttractionsSelect?: (attractions: Attraction[]) => void;
  selectedAttractions?: string[];
}

const AttractionsResults: React.FC<AttractionsResultsProps> = ({ 
  onAttractionsSelect,
  selectedAttractions = []
}) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedAttractionsState, setSelectedAttractionsState] = useState<string[]>(selectedAttractions);

  useEffect(() => {
    setSelectedAttractionsState(selectedAttractions);
  }, [selectedAttractions]);

  const initialAttractions: Attraction[] = [
    {
      id: 'a1',
      name: 'Senso-ji Temple',
      type: 'Cultural',
      price: 0,
      duration: '2-3 hours',
      rating: 4.7,
      distance: '0.8km walk',
      description: 'Ancient Buddhist temple in Asakusa district',
      bestTime: 'Early morning'
    },
    {
      id: 'a2',
      name: 'Tokyo Skytree',
      type: 'Observation',
      price: 25,
      duration: '1-2 hours',
      rating: 4.5,
      distance: '1.5km walk',
      description: 'Iconic tower with panoramic city views',
      bestTime: 'Sunset'
    },
    {
      id: 'a3',
      name: 'Shibuya Crossing',
      type: 'Experience',
      price: 0,
      duration: '30 min',
      rating: 4.6,
      distance: '2.1km by metro',
      description: 'World\'s busiest pedestrian crossing',
      bestTime: 'Evening rush hour'
    },
    {
      id: 'a4',
      name: 'Tokyo National Museum',
      type: 'Museum',
      price: 15,
      duration: '2-4 hours',
      rating: 4.4,
      distance: '3.2km by metro',
      description: 'Largest collection of Japanese art and artifacts',
      bestTime: 'Weekday mornings'
    }
  ];

  const additionalAttractions: Attraction[] = [
    {
      id: 'a5',
      name: 'Meiji Shrine',
      type: 'Cultural',
      price: 0,
      duration: '1-2 hours',
      rating: 4.5,
      distance: '2.8km by metro',
      description: 'Serene Shinto shrine dedicated to Emperor Meiji',
      bestTime: 'Morning'
    },
    {
      id: 'a6',
      name: 'Tsukiji Outer Market',
      type: 'Food & Culture',
      price: 0,
      duration: '2-3 hours',
      rating: 4.3,
      distance: '3.5km by metro',
      description: 'Famous fish market with street food and shops',
      bestTime: 'Early morning'
    },
    {
      id: 'a7',
      name: 'Imperial Palace Gardens',
      type: 'Nature',
      price: 0,
      duration: '1-2 hours',
      rating: 4.2,
      distance: '4.1km by metro',
      description: 'Beautiful gardens surrounding the Imperial Palace',
      bestTime: 'Spring & Fall'
    },
    {
      id: 'a8',
      name: 'TeamLab Borderless',
      type: 'Art & Technology',
      price: 45,
      duration: '3-4 hours',
      rating: 4.8,
      distance: '8.5km by train',
      description: 'Immersive digital art experience',
      bestTime: 'Evening'
    }
  ];

  const allAttractions = showMore ? [...initialAttractions, ...additionalAttractions] : initialAttractions;

  const toggleAttractionSelection = (attractionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedAttractionsState(prev => {
      const newSelection = prev.includes(attractionId) 
        ? prev.filter(id => id !== attractionId)
        : [...prev, attractionId];
      
      if (onAttractionsSelect) {
        const selectedAttractionsData = allAttractions.filter(a => newSelection.includes(a.id));
        onAttractionsSelect(selectedAttractionsData);
      }
      
      return newSelection;
    });
  };

  const handleGenerate = () => {
    console.log('Generating new attraction recommendations...');
    // This would typically call an API to generate new recommendations
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Camera className="w-6 h-6 text-ai-tertiary" />
          <h2 className="text-2xl font-semibold text-ai-accent">Top Attractions</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-muted">
            {selectedAttractionsState.length} selected
          </div>
          <Button
            onClick={handleGenerate}
            className="ai-button-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAttractions.map((attraction, index) => {
          const isSelected = selectedAttractionsState.includes(attraction.id);
          
          return (
            <div
              key={attraction.id}
              className={`glass-card-secondary p-5 interactive-hover animate-slide-in-up transition-all duration-300 ${
                isSelected ? 'ring-2 ring-ai-primary ai-glow-secondary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{attraction.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-ai-warning fill-current" />
                        <span className="text-sm text-foreground-muted">{attraction.rating}</span>
                      </div>
                      <button
                        onClick={(e) => toggleAttractionSelection(attraction.id, e)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                          isSelected 
                            ? 'bg-ai-primary border-ai-primary' 
                            : 'border-foreground-muted hover:border-ai-primary'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-ai-tertiary">{attraction.type}</p>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary mb-4">{attraction.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-ai-success" />
                  <span className="text-foreground-muted">
                    {attraction.price === 0 ? 'Free' : `$${attraction.price}`}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ai-primary" />
                  <span className="text-foreground-muted">{attraction.duration}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-ai-secondary" />
                  <span className="text-foreground-muted">{attraction.distance}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-ai-tertiary" />
                  <span className="text-foreground-muted">{attraction.bestTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showMore && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowMore(true)}
            className="ai-button-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Show More Attractions
          </Button>
        </div>
      )}
    </div>
  );
};

export default AttractionsResults;
