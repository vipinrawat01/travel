
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FlightResults from './FlightResults';
import HotelResults from './HotelResults';
import AttractionsResults from './AttractionsResults';
import FoodResults from './FoodResults';
import TransportResults from './TransportResults';
import BudgetTracker from './BudgetTracker';
import WeatherInsights from './WeatherInsights';
import EventsResults from './EventsResults';
import RealTimeItinerary from './RealTimeItinerary';
import { useAuth } from '../contexts/AuthContext';
import { tripService } from '../services/tripService';

interface TripResultsProps {
  onBack: () => void;
}

const TripResults: React.FC<TripResultsProps> = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedAttractions, setSelectedAttractions] = useState<any[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<any[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('flights');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing trip data on component mount
  useEffect(() => {
    const existingTripData = localStorage.getItem('editingTripResults');
    if (existingTripData) {
      const tripData = JSON.parse(existingTripData);
      setSelectedFlight(tripData.selectedFlight || null);
      setSelectedHotel(tripData.selectedHotel || null);
      setSelectedAttractions(tripData.selectedAttractions || []);
      setSelectedRestaurants(tripData.selectedRestaurants || []);
      setSelectedTransport(tripData.selectedTransport || []);
      localStorage.removeItem('editingTripResults');
    }
    
    // Debug: Check if currentTripId is available
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - TripResults mounted, currentTripId:', currentTripId);
    
    if (!currentTripId || currentTripId === 'undefined' || currentTripId === 'null') {
      console.warn('No valid trip ID found in localStorage. Planning stage updates will be stored locally until trip is saved.');
      // Store selections locally until the trip is saved
      localStorage.setItem('pendingSelections', JSON.stringify({
        flight: null,
        hotel: null,
        attractions: [],
        restaurants: [],
        transport: []
      }));
    }
  }, []);

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight);
    console.log('Selected flight:', flight);
    
    // Update planning stage for flight
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - currentTripId from localStorage:', currentTripId);
    
    if (currentTripId && currentTripId !== 'undefined' && currentTripId !== 'null' && flight) {
      console.log('Updating flight stage with trip ID:', currentTripId);
      tripService.updatePlanningStage(currentTripId, 'flight', {
        status: 'completed',
        selected_items: [flight],
        notes: `Selected flight: ${flight.airline || flight.name}`
      }).catch(error => {
        console.error('Error updating flight stage:', error);
        // If the API call fails, we can still continue with the selection
        // The trip will be saved later when the user clicks "Save Complete Trip"
      });
    } else {
      console.warn('No valid trip ID found or no flight selected. currentTripId:', currentTripId);
      console.log('Flight selection will be saved when the trip is completed.');
      
      // Store selection locally
      const pendingSelections = JSON.parse(localStorage.getItem('pendingSelections') || '{}');
      pendingSelections.flight = flight;
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
    }
  };

  const handleHotelSelect = (hotel: any) => {
    setSelectedHotel(hotel);
    console.log('Selected hotel:', hotel);
    
    // Update planning stage for hotel
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - currentTripId from localStorage:', currentTripId);
    
    if (currentTripId && currentTripId !== 'undefined' && currentTripId !== 'null' && hotel) {
      console.log('Updating hotel stage with trip ID:', currentTripId);
      tripService.updatePlanningStage(currentTripId, 'hotel', {
        status: 'completed',
        selected_items: [hotel],
        notes: `Selected hotel: ${hotel.name}`
      }).catch(error => {
        console.error('Error updating hotel stage:', error);
        // If the API call fails, we can still continue with the selection
        // The trip will be saved later when the user clicks "Save Complete Trip"
      });
    } else {
      console.warn('No valid trip ID found or no hotel selected. currentTripId:', currentTripId);
      console.log('Hotel selection will be saved when the trip is completed.');
      
      // Store selection locally
      const pendingSelections = JSON.parse(localStorage.getItem('pendingSelections') || '{}');
      pendingSelections.hotel = hotel;
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
    }
  };

  const handleAttractionsSelect = (attractions: any[]) => {
    setSelectedAttractions(attractions);
    console.log('Selected attractions:', attractions);
    
    // Update planning stage for attractions
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - currentTripId from localStorage:', currentTripId);
    
    if (currentTripId && currentTripId !== 'undefined' && currentTripId !== 'null') {
      console.log('Updating attractions stage with trip ID:', currentTripId);
      tripService.updatePlanningStage(currentTripId, 'attractions', {
        status: attractions.length > 0 ? 'completed' : 'pending',
        selected_items: attractions,
        notes: `Selected ${attractions.length} attractions`
      }).catch(error => {
        console.error('Error updating attractions stage:', error);
        // If the API call fails, we can still continue with the selection
        // The trip will be saved later when the user clicks "Save Complete Trip"
      });
    } else {
      console.warn('No valid trip ID found. currentTripId:', currentTripId);
      console.log('Attractions selection will be saved when the trip is completed.');
      
      // Store selection locally
      const pendingSelections = JSON.parse(localStorage.getItem('pendingSelections') || '{}');
      pendingSelections.attractions = attractions;
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
    }
  };

  const handleRestaurantsSelect = (restaurants: any[]) => {
    setSelectedRestaurants(restaurants);
    console.log('Selected restaurants:', restaurants);
    
    // Update planning stage for food
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - currentTripId from localStorage:', currentTripId);
    
    if (currentTripId && currentTripId !== 'undefined' && currentTripId !== 'null') {
      console.log('Updating food stage with trip ID:', currentTripId);
      tripService.updatePlanningStage(currentTripId, 'food', {
        status: restaurants.length > 0 ? 'completed' : 'pending',
        selected_items: restaurants,
        notes: `Selected ${restaurants.length} restaurants`
      }).catch(error => {
        console.error('Error updating food stage:', error);
        // If the API call fails, we can still continue with the selection
        // The trip will be saved later when the user clicks "Save Complete Trip"
      });
    } else {
      console.warn('No valid trip ID found. currentTripId:', currentTripId);
      console.log('Restaurants selection will be saved when the trip is completed.');
      
      // Store selection locally
      const pendingSelections = JSON.parse(localStorage.getItem('pendingSelections') || '{}');
      pendingSelections.restaurants = restaurants;
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
    }
  };

  const handleTransportSelect = (transport: any[]) => {
    setSelectedTransport(transport);
    console.log('Selected transport:', transport);
    
    // Update planning stage for transport
    const currentTripId = localStorage.getItem('currentTripId');
    console.log('Debug - currentTripId from localStorage:', currentTripId);
    
    if (currentTripId && currentTripId !== 'undefined' && currentTripId !== 'null') {
      console.log('Updating transport stage with trip ID:', currentTripId);
      tripService.updatePlanningStage(currentTripId, 'transport', {
        status: transport.length > 0 ? 'completed' : 'pending',
        selected_items: transport,
        notes: `Selected ${transport.length} transport options`
      }).catch(error => {
        console.error('Error updating transport stage:', error);
        // If the API call fails, we can still continue with the selection
        // The trip will be saved later when the user clicks "Save Complete Trip"
      });
    } else {
      console.warn('No valid trip ID found. currentTripId:', currentTripId);
      console.log('Transport selection will be saved when the trip is completed.');
      
      // Store selection locally
      const pendingSelections = JSON.parse(localStorage.getItem('pendingSelections') || '{}');
      pendingSelections.transport = transport;
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
    }
  };

  const canViewItinerary = selectedFlight && selectedHotel;

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      setSaveError('Please log in to save your trip');
      return;
    }

    // Validate minimum selections
    if (!selectedFlight) {
      setSaveError('Please select a flight to continue');
      return;
    }

    if (!selectedHotel) {
      setSaveError('Please select a hotel to continue');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get the current trip ID from localStorage
      const currentTripId = localStorage.getItem('currentTripId');
      const tripPlanningData = localStorage.getItem('tripPlanningData');
      
      console.log('Debug - currentTripId from localStorage:', currentTripId);
      console.log('Debug - currentTripId type:', typeof currentTripId);
      console.log('Debug - currentTripId === null:', currentTripId === null);
      console.log('Debug - currentTripId === "null":', currentTripId === 'null');
      console.log('Debug - currentTripId === "undefined":', currentTripId === 'undefined');
      console.log('Debug - tripPlanningData:', tripPlanningData);
      
      if (!tripPlanningData) {
        throw new Error('Trip planning data not found. Please start over.');
      }

      const planningData = JSON.parse(tripPlanningData);

      // Log all selected items for debugging
      console.log('Saving trip with selections:', {
        flight: selectedFlight,
        hotel: selectedHotel,
        attractions: selectedAttractions,
        restaurants: selectedRestaurants,
        transport: selectedTransport,
      });

      // Add all selected items to the existing trip
      const selectedItems = {
        flight: selectedFlight,
        hotel: selectedHotel,
        attractions: selectedAttractions,
        restaurants: selectedRestaurants,
        transport: selectedTransport,
      };

      // Use the saveCompleteTrip method to add all items
      const existingTripId = currentTripId && currentTripId !== 'null' && currentTripId !== 'undefined' ? currentTripId : undefined;
      console.log('Debug - Passing existingTripId to saveCompleteTrip:', existingTripId);
      
      const updatedTrip = await tripService.saveCompleteTrip(
        {
          title: `${planningData.destination} Trip`,
          destination: planningData.destination,
          description: `A ${planningData.travelStyle} trip to ${planningData.destination}`,
          start_date: planningData.startDate,
          end_date: planningData.endDate,
          budget: parseFloat(planningData.budget),
          travelers: parseInt(planningData.travelers),
          travel_style: planningData.travelStyle,
        },
        selectedItems,
        existingTripId
      );

      console.log('Trip saved successfully:', updatedTrip);
      setSaveSuccess(true);
      
      // Clear localStorage data
      localStorage.removeItem('currentTripId');
      localStorage.removeItem('tripPlanningData');
      localStorage.removeItem('editingTripResults');
      localStorage.removeItem('pendingSelections'); // Clear any pending selections
      
    } catch (error) {
      console.error('Error saving trip:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save trip');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onBack}
            className="ai-button-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Planning
          </Button>
          
          <div className="text-center">
            <h1 className="text-hero text-3xl md:text-4xl">
              AI Travel Results
            </h1>
            <p className="text-foreground-secondary">
              Your personalized Tokyo journey options
            </p>
          </div>

          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Progress Indicator */}
        <div className="glass-card-secondary p-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedFlight ? 'bg-ai-success' : 'bg-ai-primary animate-pulse'}`} />
              <span className="text-sm text-foreground-muted">Flights</span>
            </div>
            <div className="w-8 h-0.5 bg-background-tertiary" />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedHotel ? 'bg-ai-success' : selectedFlight ? 'bg-ai-secondary animate-pulse' : 'bg-foreground-muted'}`} />
              <span className="text-sm text-foreground-muted">Hotels</span>
            </div>
            <div className="w-8 h-0.5 bg-background-tertiary" />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedAttractions.length > 0 ? 'bg-ai-success' : selectedHotel ? 'bg-ai-tertiary animate-pulse' : 'bg-foreground-muted'}`} />
              <span className="text-sm text-foreground-muted">Places</span>
            </div>
            <div className="w-8 h-0.5 bg-background-tertiary" />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedRestaurants.length > 0 ? 'bg-ai-success' : selectedAttractions.length > 0 ? 'bg-ai-warning animate-pulse' : 'bg-foreground-muted'}`} />
              <span className="text-sm text-foreground-muted">Food</span>
            </div>
            <div className="w-8 h-0.5 bg-background-tertiary" />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedTransport.length > 0 ? 'bg-ai-success' : selectedRestaurants.length > 0 ? 'bg-ai-tertiary animate-pulse' : 'bg-foreground-muted'}`} />
              <span className="text-sm text-foreground-muted">Transport</span>
            </div>
            <div className="w-8 h-0.5 bg-background-tertiary" />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${canViewItinerary ? 'bg-ai-tertiary animate-pulse' : 'bg-foreground-muted'}`} />
              <span className="text-sm text-foreground-muted">Live Plan</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 glass-card p-2">
            <TabsTrigger value="flights" className="text-xs">Flights</TabsTrigger>
            <TabsTrigger value="hotels" className="text-xs">Hotels</TabsTrigger>
            <TabsTrigger value="attractions" className="text-xs">Places</TabsTrigger>
            <TabsTrigger value="food" className="text-xs">Food</TabsTrigger>
            <TabsTrigger value="transport" className="text-xs">Transport</TabsTrigger>
            <TabsTrigger value="weather" className="text-xs">Weather</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
            <TabsTrigger 
              value="itinerary" 
              className="text-xs"
              disabled={!canViewItinerary}
            >
              Live Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-6">
            <FlightResults 
              onFlightSelect={handleFlightSelect}
              selectedFlight={selectedFlight}
            />
            {selectedFlight && (
              <div className="text-center">
                <Button
                  onClick={() => setCurrentTab('hotels')}
                  className="ai-button-primary"
                >
                  Continue to Hotels
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hotels" className="space-y-6">
            <HotelResults 
              onHotelSelect={handleHotelSelect}
              selectedHotel={selectedHotel}
            />
            {selectedHotel && (
              <div className="text-center">
                <Button
                  onClick={() => setCurrentTab('attractions')}
                  className="ai-button-primary"
                >
                  Explore Places
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attractions" className="space-y-6">
            <AttractionsResults 
              onAttractionsSelect={handleAttractionsSelect}
              selectedAttractions={selectedAttractions.map(item => item.id)}
            />
            <div className="text-center">
              <Button
                onClick={() => setCurrentTab('food')}
                className="ai-button-primary"
              >
                Discover Food
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="food" className="space-y-6">
            <FoodResults 
              onRestaurantsSelect={handleRestaurantsSelect}
              selectedRestaurants={selectedRestaurants.map(item => item.id)}
            />
            <div className="text-center">
              <Button
                onClick={() => setCurrentTab('transport')}
                className="ai-button-primary"
              >
                Choose Transport
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="transport" className="space-y-6">
            <TransportResults 
              onTransportSelect={handleTransportSelect}
              selectedTransport={selectedTransport.map(item => item.id)}
            />
            <div className="text-center">
              <Button
                onClick={() => setCurrentTab('budget')}
                className="ai-button-primary"
              >
                Review Budget
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="weather">
            <WeatherInsights />
          </TabsContent>

          <TabsContent value="events">
            <EventsResults />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTracker 
              selectedFlight={selectedFlight}
              selectedHotel={selectedHotel}
              selectedAttractions={selectedAttractions}
              selectedRestaurants={selectedRestaurants}
              selectedTransport={selectedTransport}
              initialBudget={(() => {
                const tripPlanningData = localStorage.getItem('tripPlanningData');
                if (tripPlanningData) {
                  const planningData = JSON.parse(tripPlanningData);
                  return parseFloat(planningData.budget) || 3200;
                }
                return 3200;
              })()}
            />
            
            {/* Save Trip Section */}
            <div className="mt-8 glass-card p-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-ai-accent">Save Your Trip</h3>
                
                {/* Selection Summary */}
                <div className="text-left space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedFlight ? 'bg-ai-success' : 'bg-red-500'}`} />
                    <span className="text-foreground-muted">Flight: {selectedFlight ? selectedFlight.airline || selectedFlight.name : 'Not selected'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedHotel ? 'bg-ai-success' : 'bg-red-500'}`} />
                    <span className="text-foreground-muted">Hotel: {selectedHotel ? selectedHotel.name : 'Not selected'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedAttractions.length > 0 ? 'bg-ai-success' : 'bg-ai-warning'}`} />
                    <span className="text-foreground-muted">Attractions: {selectedAttractions.length} selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedRestaurants.length > 0 ? 'bg-ai-success' : 'bg-ai-warning'}`} />
                    <span className="text-foreground-muted">Restaurants: {selectedRestaurants.length} selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTransport.length > 0 ? 'bg-ai-success' : 'bg-ai-warning'}`} />
                    <span className="text-foreground-muted">Transport: {selectedTransport.length} selected</span>
                  </div>
                </div>
                
                {saveError && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-500 text-center">{saveError}</p>
                  </div>
                )}
                
                {saveSuccess && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-500 text-center">Trip saved successfully! You can view it in your trips.</p>
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleSaveTrip}
                    disabled={isSaving || !selectedFlight || !selectedHotel}
                    className="ai-button-primary px-8 py-3"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Trip...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 w-4 h-4" />
                        Save Complete Trip
                      </>
                    )}
                  </Button>
                </div>
                
                {(!selectedFlight || !selectedHotel) && (
                  <p className="text-sm text-foreground-muted">
                    Please select at least a flight and hotel to save your trip.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="itinerary">
            {canViewItinerary ? (
              <RealTimeItinerary />
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-foreground-muted">
                  Please select a flight and hotel to generate your live itinerary.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {canViewItinerary && currentTab !== 'itinerary' && (
          <div className="fixed bottom-6 right-6">
            <Button
              onClick={() => setCurrentTab('itinerary')}
              className="ai-button-primary shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              View Live Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripResults;
