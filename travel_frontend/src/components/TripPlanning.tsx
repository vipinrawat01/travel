
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Sparkles,
  ChevronRight,
  Search,
  Plane,
  Camera,
  Utensils,
  Mountain,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { tripService, TripData } from '../services/tripService';

interface TripPlanningProps {
  onBack?: () => void;
}

const TripPlanning: React.FC<TripPlanningProps> = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '1',
    travelStyle: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for editing data on component mount
  useEffect(() => {
    const editingTrip = localStorage.getItem('editingTrip');
    if (editingTrip) {
      try {
        const tripData = JSON.parse(editingTrip);
        // Normalize fields explicitly to avoid missing/empty values
        setFormData((prev) => ({
          destination: String(tripData.destination ?? prev.destination ?? ''),
          startDate: String(tripData.startDate ?? prev.startDate ?? ''),
          endDate: String(tripData.endDate ?? prev.endDate ?? ''),
          budget: String(
            tripData.budget !== undefined && tripData.budget !== null
              ? tripData.budget
              : prev.budget ?? ''
          ),
          travelers: String(
            tripData.travelers !== undefined && tripData.travelers !== null
              ? tripData.travelers
              : prev.travelers ?? '1'
          ),
          travelStyle: String(tripData.travelStyle ?? prev.travelStyle ?? ''),
        }));
      } catch {}
      localStorage.removeItem('editingTrip'); // Clear after loading
    }
  }, []);

  const travelStyles = [
    { id: 'luxury', name: 'Luxury', icon: Sparkles, desc: 'Premium experiences' },
    { id: 'adventure', name: 'Adventure', icon: Mountain, desc: 'Thrilling activities' },
    { id: 'cultural', name: 'Cultural', icon: Camera, desc: 'Local immersion' },
    { id: 'culinary', name: 'Culinary', icon: Utensils, desc: 'Food experiences' }
  ];

  const popularDestinations = [
    'Tokyo, Japan',
    'Paris, France', 
    'New York, USA',
    'Bali, Indonesia',
    'London, UK',
    'Rome, Italy'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('Please log in to save your trip');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget || !formData.travelStyle) {
        throw new Error('Please fill in all required fields');
      }

      // Create trip data for the backend
      const tripData: TripData = {
        title: `${formData.destination} Trip`,
        destination: formData.destination,
        description: `A ${formData.travelStyle} trip to ${formData.destination}`,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: parseFloat(formData.budget),
        travelers: parseInt(formData.travelers),
        travel_style: formData.travelStyle,
      };

      // Save trip to database
      const savedTrip = await tripService.createTrip(tripData);
      
      console.log('Debug - Full savedTrip response:', savedTrip);
      console.log('Debug - savedTrip.id:', savedTrip.id);
      console.log('Debug - savedTrip type:', typeof savedTrip.id);
      
      // Check if we have a valid trip ID
      if (!savedTrip.id) {
        console.error('No trip ID returned from backend. Response:', savedTrip);
        throw new Error('Failed to create trip: No trip ID returned');
      }
      
      // Derive city and country hints from destination text input
      const deriveCityCountry = (raw: string): { cityHint?: string; countryHint?: string } => {
        const parts = String(raw)
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length === 0) return {};
        const normalize = (s: string) => s.toLowerCase().replace(/\./g, '').trim();
        const knownCountries = new Set([
          'india','canada','united states','usa','united kingdom','uk','england','scotland','wales','ireland',
          'france','germany','italy','spain','portugal','netherlands','belgium','switzerland','austria','poland',
          'greece','turkey','czech republic','slovakia','hungary','romania','bulgaria','croatia','slovenia','serbia',
          'bosnia and herzegovina','montenegro','albania','north macedonia','norway','sweden','finland','denmark',
          'iceland','russia','ukraine','belarus','estonia','latvia','lithuania','mexico','brazil','argentina',
          'chile','peru','colombia','ecuador','venezuela','uruguay','paraguay','bolivia','australia','new zealand',
          'china','japan','south korea','singapore','malaysia','indonesia','thailand','vietnam','philippines',
          'cambodia','laos','myanmar','sri lanka','pakistan','bangladesh','nepal','bhutan','maldives','uae',
          'united arab emirates','saudi arabia','qatar','bahrain','oman','kuwait','egypt','south africa','kenya',
          'nigeria','ethiopia','morocco','tunisia','algeria','ghana','tanzania','uganda','rwanda','botswana'
        ]);
        const first = parts[0];
        const last = parts[parts.length - 1];
        const firstNorm = normalize(first);
        const lastNorm = normalize(last);
        const isCountryToken = (t: string) => knownCountries.has(normalize(t));
        const isCountryCode = (t: string) => /^[A-Z]{2,3}$/.test(t);
        // Prefer explicit country token when present
        if (isCountryToken(first)) return { countryHint: first, cityHint: last };
        if (isCountryToken(last)) return { countryHint: last, cityHint: first };
        // Country codes like US, UK, CA
        if (isCountryCode(last)) return { countryHint: last, cityHint: first };
        if (isCountryCode(first)) return { countryHint: first, cityHint: last };
        // If first token is a known big country-like token (e.g., 'india'), assume country first
        if (firstNorm.length >= 4 && lastNorm.length < firstNorm.length) {
          return { countryHint: first, cityHint: last };
        }
        return {};
      };

      const { cityHint, countryHint } = deriveCityCountry(formData.destination);

      // Store the trip ID and enriched form data for the results page
      const planningDataToStore = { ...formData, cityHint, countryHint };
      localStorage.setItem('tripPlanningData', JSON.stringify(planningDataToStore));
      localStorage.setItem('currentTripId', savedTrip.id);
      
      console.log('Debug - Trip created with ID:', savedTrip.id);
      console.log('Debug - currentTripId stored in localStorage:', localStorage.getItem('currentTripId'));
      
      // Create planning stages for the trip
      const planningStages = [
        { stage_type: 'flight', status: 'pending', selected_items: [], ai_options: [], stage_preferences: {}, notes: '' },
        { stage_type: 'hotel', status: 'pending', selected_items: [], ai_options: [], stage_preferences: {}, notes: '' },
        { stage_type: 'attractions', status: 'pending', selected_items: [], ai_options: [], stage_preferences: {}, notes: '' },
        { stage_type: 'food', status: 'pending', selected_items: [], ai_options: [], stage_preferences: {}, notes: '' },
        { stage_type: 'transport', status: 'pending', selected_items: [], ai_options: [], stage_preferences: {}, notes: '' }
      ];
      
      try {
        await tripService.updateTripPlanningProgress(savedTrip.id, planningStages);
        console.log('Planning stages created successfully');
      } catch (error) {
        console.error('Error creating planning stages:', error);
      }
      
      // Also check if there's existing trip data to carry forward
      const existingTripData = localStorage.getItem('existingTripData');
      if (existingTripData) {
        localStorage.setItem('editingTripResults', existingTripData);
      }
      
      console.log('Trip saved to database:', savedTrip);
      
      // Navigate to results - this will be handled by parent component
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('showTripResults', { detail: planningDataToStore });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to save trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between animate-slide-in-up">
          <Button
            onClick={onBack}
            className="ai-button-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center flex-1">
            <h1 className="text-hero text-3xl md:text-5xl">
              Plan Your Perfect Journey
            </h1>
            <p className="text-foreground-secondary text-lg">
              Let our AI agents create a personalized travel experience just for you
            </p>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Main Planning Form */}
        <div className="glass-card p-8 space-y-8 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          {/* Destination Input */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-ai-primary" />
              <h2 className="text-xl font-semibold text-ai-accent">Where do you want to go?</h2>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Enter destination..."
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                className="ai-input pl-12"
              />
            </div>

            {/* Popular Destinations */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {popularDestinations.map((destination, index) => (
                <button
                  key={destination}
                  onClick={() => handleInputChange('destination', destination)}
                  className="glass-card-secondary p-3 text-sm interactive-hover text-left group animate-fade-in"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-ai-primary group-hover:scale-110 transition-transform" />
                    <span className="text-foreground-secondary group-hover:text-foreground">{destination}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-ai-secondary" />
                <h2 className="text-xl font-semibold text-ai-accent">When?</h2>
              </div>
              
              <div className="space-y-3">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="ai-input"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="ai-input"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Budget & Travelers */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-ai-tertiary" />
                <h2 className="text-xl font-semibold text-ai-accent">Budget & Group</h2>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="number"
                    placeholder="Total budget (USD)"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="ai-input pl-12"
                  />
                </div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <select
                    value={formData.travelers}
                    onChange={(e) => handleInputChange('travelers', e.target.value)}
                    className="ai-input pl-12 appearance-none"
                  >
                    <option value="1">Solo traveler</option>
                    <option value="2">2 travelers</option>
                    <option value="3">3 travelers</option>
                    <option value="4">4+ travelers</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Style */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-ai-accent flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-ai-primary" />
              <span>What's your travel style?</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {travelStyles.map((style, index) => {
                const StyleIcon = style.icon;
                const isSelected = formData.travelStyle === style.id;
                
                return (
                  <button
                    key={style.id}
                    onClick={() => handleInputChange('travelStyle', style.id)}
                    className={`glass-card-secondary p-4 text-center interactive-hover group transition-all duration-300 animate-slide-in-up ${
                      isSelected ? 'ring-2 ring-ai-primary ai-glow-secondary' : ''
                    }`}
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <StyleIcon className={`w-8 h-8 mx-auto mb-2 transition-all group-hover:scale-110 ${
                      isSelected ? 'text-ai-primary' : 'text-foreground-muted group-hover:text-ai-primary'
                    }`} />
                    <h3 className={`font-medium mb-1 ${
                      isSelected ? 'text-ai-primary' : 'text-foreground group-hover:text-foreground'
                    }`}>
                      {style.name}
                    </h3>
                    <p className="text-xs text-foreground-muted">{style.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="glass-card-secondary p-4 border border-red-500/20 animate-slide-in-up">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleSubmit}
              className="ai-button-primary px-8 py-4 text-lg group"
              disabled={!formData.destination || !formData.startDate || !formData.endDate || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-3 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Trip...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 w-5 h-5" />
                  Activate AI Agents
                  <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* AI Preview */}
        <div className="glass-card-secondary p-6 text-center animate-slide-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-ai-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-ai-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 bg-ai-tertiary rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <p className="text-foreground-secondary">
            Your AI agents are ready to collaborate on creating the perfect itinerary
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripPlanning;
