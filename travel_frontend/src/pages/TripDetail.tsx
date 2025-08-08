
import React, { useState } from 'react';
import { ArrowLeft, Users, Edit, Share2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealTimeItinerary from '@/components/RealTimeItinerary';
import ExpenseSplitter from '@/components/ExpenseSplitter';

const TripDetail: React.FC = () => {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [currentTab, setCurrentTab] = useState('itinerary');

  // Mock trip data
  const trip = {
    id: tripId,
    title: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    startDate: '2024-12-16',
    endDate: '2024-12-20',
    totalCost: 2500,
    travelers: [
      { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '/placeholder.svg' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '/placeholder.svg' },
      { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: '/placeholder.svg' }
    ],
    status: 'upcoming'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/my-trips')}
            className="ai-button-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Trips
          </Button>
          
          <div className="text-center">
            <h1 className="text-hero text-3xl md:text-4xl">
              {trip.title}
            </h1>
            <p className="text-foreground-secondary">
              {trip.destination} • {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => navigate('/', { state: { editTripId: trip.id } })}
              className="ai-button-secondary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Trip
            </Button>
            <Button className="ai-button-secondary">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {trip.travelers.slice(0, 3).map((traveler, index) => (
                  <div
                    key={traveler.id}
                    className="w-10 h-10 rounded-full bg-ai-primary/20 border-2 border-white flex items-center justify-center text-sm font-medium text-ai-primary"
                    style={{ zIndex: trip.travelers.length - index }}
                  >
                    {traveler.name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
                {trip.travelers.length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-foreground-muted border-2 border-white flex items-center justify-center text-xs text-white">
                    +{trip.travelers.length - 3}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{trip.travelers.length} Travelers</p>
                <p className="text-sm text-foreground-muted">
                  {trip.travelers.map(t => t.name).join(', ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ai-success">${trip.totalCost.toLocaleString()}</p>
              <p className="text-sm text-foreground-muted">Total Budget</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 glass-card p-2">
            <TabsTrigger value="itinerary" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Live Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Expense Splitter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <RealTimeItinerary />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseSplitter travelers={trip.travelers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripDetail;
