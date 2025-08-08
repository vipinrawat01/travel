
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, MapPin, Users, Edit2, Trash2, Eye, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tripService, Trip } from '../services/tripService';

const MyTrips = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadTrips();
    }
  }, [isAuthenticated]);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTrips = await tripService.getTrips();
      setTrips(fetchedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    // Store trip data in localStorage for the planning page to use
    localStorage.setItem('editingTrip', JSON.stringify({
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      budget: trip.budget.toString(),
      travelers: trip.travelers.toString(),
      travelStyle: trip.travel_style
    }));
    
    // Extract selected items from trip.items
    const selectedItems = {
      selectedFlight: trip.items.find(item => item.item_type === 'flight' && item.is_selected),
      selectedHotel: trip.items.find(item => item.item_type === 'hotel' && item.is_selected),
      selectedAttractions: trip.items.filter(item => item.item_type === 'attraction' && item.is_selected),
      selectedRestaurants: trip.items.filter(item => item.item_type === 'restaurant' && item.is_selected),
      selectedTransport: trip.items.filter(item => item.item_type === 'transport' && item.is_selected)
    };
    
    // Store the complete trip data including selections for results page
    localStorage.setItem('existingTripData', JSON.stringify(selectedItems));
    
    // Navigate to the main page but set it to show the planning screen
    localStorage.setItem('showPlanningScreen', 'true');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-ai-primary text-white';
      case 'ongoing': return 'bg-ai-success text-white';
      case 'completed': return 'bg-ai-secondary text-white';
      default: return 'bg-foreground-muted text-foreground';
    }
  };

  const getTravelStyleName = (style: string) => {
    const styles: { [key: string]: string } = {
      'luxury': 'Luxury',
      'adventure': 'Adventure',
      'cultural': 'Cultural',
      'culinary': 'Culinary'
    };
    return styles[style] || style;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            className="ai-button-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-hero text-3xl md:text-4xl">
              My Trips
            </h1>
            <p className="text-foreground-secondary">
              Manage and view your travel plans
            </p>
          </div>

          <Button
            onClick={() => navigate('/')}
            className="ai-button-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Plan New Trip
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card p-12 text-center">
            <Loader2 className="w-8 h-8 text-ai-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground-muted">Loading your trips...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 border border-red-500/20">
            <p className="text-red-500 text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={loadTrips} className="ai-button-secondary">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Trips Grid */}
        {!isLoading && !error && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, index) => (
              <div
                key={trip.id}
                className="glass-card overflow-hidden animate-slide-in-up group hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Trip Image */}
                <div className="h-48 bg-gradient-to-br from-ai-primary/20 to-ai-secondary/20 relative overflow-hidden">
                  <img
                    src={trip.image_url || '/placeholder.svg'}
                    alt={trip.destination}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </div>
                </div>

                {/* Trip Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {trip.destination}
                    </h3>
                    <p className="text-sm text-ai-primary">
                      {getTravelStyleName(trip.travel_style)} Trip
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-ai-secondary" />
                      <span className="text-foreground-muted">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-ai-tertiary" />
                      <span className="text-foreground-muted">
                        {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-ai-success" />
                      <span className="text-foreground-muted">
                        ${trip.budget.toLocaleString()} budget
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => navigate(`/trip/${trip.id}`)}
                      className="ai-button-secondary flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      onClick={() => handleEditTrip(trip)}
                      className="ai-button-primary flex-1 text-xs"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => console.log('Delete trip:', trip.id)}
                      className="ai-button-secondary text-xs px-3"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && trips.length === 0 && (
          <div className="glass-card p-12 text-center">
            <MapPin className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No trips planned yet
            </h3>
            <p className="text-foreground-muted mb-6">
              Start planning your next adventure with our AI agents
            </p>
            <Button
              onClick={() => navigate('/')}
              className="ai-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Your First Trip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrips;
