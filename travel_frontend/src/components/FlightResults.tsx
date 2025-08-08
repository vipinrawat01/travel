import React, { useState, useEffect } from 'react';
import { Plane, Clock, DollarSign, Calendar, ArrowRight, Sparkles, Loader2, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { flightService, Flight, FlightSearchParams } from '../services/flightService';

interface FlightResultsProps {
  onFlightSelect: (flight: Flight) => void;
  selectedFlight?: Flight | null;
}

const FlightResults: React.FC<FlightResultsProps> = ({ onFlightSelect, selectedFlight }) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [destinationQuery, setDestinationQuery] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Get trip planning data from localStorage
  useEffect(() => {
    const tripPlanningData = localStorage.getItem('tripPlanningData');
    if (tripPlanningData) {
      try {
        const data = JSON.parse(tripPlanningData);
        const destQuery = data.cityHint || data.destination;
        setDestinationQuery(destQuery);
        const params: FlightSearchParams = {
          origin: 'NYC', // Default origin - could be made dynamic based on user location
          destination: destQuery,
          departure_date: data.startDate,
          return_date: data.endDate,
          adults: parseInt(data.travelers) || 1,
          cabin_class: 'economy',
          preferences: {
            max_budget: parseFloat(data.budget) || undefined,
            max_stops: 2,
            preferred_airlines: []
          }
        };
        setSearchParams(params);
      } catch (e) {
        console.error('Error parsing trip planning data:', e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!searchParams) {
      setError('No trip data available. Please complete trip planning first.');
      return;
    }

    setIsLoading(true);
    setError(null);

      try {
      console.log('Searching flights with AI agent...', searchParams);
        // Resolve destination to IATA/city code when possible
        const resolveDestinationCode = async (q: string): Promise<string> => {
          try {
            const suggestions = await flightService.getAirportSuggestions(q);
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              // Prefer exact city name match, else first suggestion
              const lowerQ = q.toLowerCase();
              const exactCity = suggestions.find(s => s.city && s.city.toLowerCase() === lowerQ);
              const containsCity = suggestions.find(s => s.city && s.city.toLowerCase().includes(lowerQ));
              const pick = exactCity || containsCity || suggestions[0];
              return pick.code || pick.city || q;
            }
          } catch {}
          return q;
        };

        const destQ = destinationQuery || searchParams.destination;
        const isLikelyCode = typeof destQ === 'string' && /^[A-Za-z]{3}$/.test(destQ.trim());
        const finalDestination = isLikelyCode ? destQ.trim().toUpperCase() : await resolveDestinationCode(destQ);

        const response = await flightService.searchFlights({ ...searchParams, destination: finalDestination });
      
      if (response.success) {
        const extractedFlights = flightService.extractFlightsFromResponse(response);
        const extractedRecommendations = flightService.getRecommendations(response);
        
        setFlights(extractedFlights);
        setRecommendations(extractedRecommendations);
          // Capture AI analysis text if available
          const summary = (response.data && (response.data as any).summary) as string | undefined;
          const analysis = summary || response.raw_response || null;
          setAiAnalysis(analysis || null);
        
        console.log('AI Flight search results:', response);
        console.log('Extracted flights:', extractedFlights);
        console.log('Recommendations:', extractedRecommendations);
          if (extractedFlights.length === 0) {
            const msg = flightService.getMessageFromResponse(response);
            if (msg) setError(msg);
          }
      } else {
        setError(response.error || 'Failed to search flights');
      }
    } catch (error) {
      console.error('Error searching flights:', error);
      setError(error instanceof Error ? error.message : 'Failed to search flights');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getRecommendationBadge = (flight: Flight) => {
    if (!recommendations) return null;
    
    if (recommendations.best_value?.id === flight.id) {
      return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Best Value</span>;
    }
    if (recommendations.fastest?.id === flight.id) {
      return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Fastest</span>;
    }
    if (recommendations.most_convenient?.id === flight.id) {
      return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Most Convenient</span>;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Plane className="w-6 h-6 text-ai-primary" />
          <h2 className="text-2xl font-semibold text-ai-accent">Flight Options</h2>
        </div>
        
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !searchParams}
          className="ai-button-primary"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
          <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Searching...' : 'Generate with AI'}
        </Button>
      </div>

      {/* Search Parameters Display */}
      {searchParams && (
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-ai-secondary" />
              <span>{searchParams.origin} → {searchParams.destination}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-ai-tertiary" />
              <span>{searchParams.departure_date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-ai-success" />
              <span>Budget: ${searchParams.preferences?.max_budget || 'Unlimited'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="glass-card p-4 border border-red-500/20">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-8 h-8 text-ai-primary animate-spin mx-auto mb-4" />
          <p className="text-foreground-muted">AI Agent is searching for the best flights...</p>
        </div>
      )}

      {/* Flights List */}
      {!isLoading && flights.length > 0 && (
      <div className="space-y-4">
        {flights.map((flight, index) => (
          <div
            key={flight.id}
            className={`glass-card p-6 interactive-hover cursor-pointer transition-all animate-slide-in-up ${
              selectedFlight?.id === flight.id ? 'ring-2 ring-ai-primary ai-glow' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onFlightSelect(flight)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-ai-primary/20 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-ai-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{flight.airline}</h3>
                  <p className="text-sm text-foreground-muted">
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
                
              <div className="text-right">
                  <div className="text-2xl font-bold text-ai-success">
                    {formatPrice(flight.price)}
                  </div>
                  {getRecommendationBadge(flight)}
              </div>
            </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-ai-secondary" />
                    <span>{flight.duration}</span>
                  </div>
              <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-ai-tertiary" />
                    <span>{flight.departureTime} - {flight.arrivalTime}</span>
                </div>
              </div>

                <div className="flex items-center space-x-2">
                  <span className="text-foreground-muted">{flight.departure}</span>
                  <ArrowRight className="w-4 h-4 text-ai-primary" />
                  <span className="text-foreground-muted">{flight.arrival}</span>
                </div>
              </div>
                </div>
          ))}
        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <div className="text-sm whitespace-pre-wrap text-foreground-muted">{aiAnalysis}</div>
          </div>
        )}
      </div>
      )}

      {/* Empty State with AI Analysis if present */}
      {!isLoading && flights.length === 0 && !error && (
        <div className="glass-card p-12 text-center">
          <Search className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Ready to Find Your Perfect Flight
          </h3>
          <p className="text-foreground-muted mb-6">
            Click "Generate with AI" to search for flights using our intelligent AI agent
          </p>
          <Button
            onClick={handleGenerate}
            disabled={!searchParams}
            className="ai-button-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          {aiAnalysis && (
            <div className="mt-6 text-left">
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <div className="text-sm whitespace-pre-wrap text-foreground-muted max-h-64 overflow-auto glass-card-secondary p-4">
                {aiAnalysis}
              </div>
            </div>
          )}
              </div>
            )}
    </div>
  );
};

export default FlightResults;
