
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plane, 
  Hotel, 
  Camera, 
  Utensils, 
  DollarSign,
  Download,
  Share2,
  CheckCircle,
  Luggage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: Activity[];
  totalCost: number;
  walkingDistance: string;
  weather: string;
}

interface Activity {
  id: string;
  time: string;
  type: 'flight' | 'hotel' | 'attraction' | 'meal' | 'transport';
  title: string;
  location: string;
  duration: string;
  cost: number;
  notes?: string;
  tips?: string;
}

const FinalItinerary: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(0);

  const itineraryData: ItineraryDay[] = [
    {
      date: 'December 16, 2024',
      dayNumber: 1,
      weather: 'Sunny, 22-28°C',
      walkingDistance: '3.2 km',
      totalCost: 85,
      activities: [
        {
          id: '1',
          time: '06:25',
          type: 'flight',
          title: 'Arrive at Narita Airport (NRT)',
          location: 'Terminal 1',
          duration: '1 hour',
          cost: 0,
          notes: 'Immigration and customs',
          tips: 'Get JR Pass at airport counter'
        },
        {
          id: '2',
          time: '08:00',
          type: 'transport',
          title: 'Narita Express to Tokyo Station',
          location: 'Narita Airport → Tokyo Station',
          duration: '1 hour',
          cost: 35,
          tips: 'Reserve seats in advance'
        },
        {
          id: '3',
          time: '10:30',
          type: 'hotel',
          title: 'Check-in at Sakura Inn',
          location: 'Shinjuku District',
          duration: '30 min',
          cost: 0,
          notes: 'Room ready, store luggage if early'
        },
        {
          id: '4',
          time: '12:00',
          type: 'meal',
          title: 'Lunch at Ramen Yokocho',
          location: 'Shinjuku',
          duration: '1 hour',
          cost: 15,
          tips: 'Try the tonkotsu ramen'
        },
        {
          id: '5',
          time: '14:00',
          type: 'attraction',
          title: 'Senso-ji Temple Visit',
          location: 'Asakusa',
          duration: '2.5 hours',
          cost: 0,
          tips: 'Best photos in front courtyard'
        },
        {
          id: '6',
          time: '18:00',
          type: 'meal',
          title: 'Dinner at Izakaya Torikizoku',
          location: 'Shibuya',
          duration: '1.5 hours',
          cost: 35,
          tips: 'Try yakitori and sake pairing'
        }
      ]
    },
    {
      date: 'December 17, 2024',
      dayNumber: 2,
      weather: 'Partly Cloudy, 20-26°C',
      walkingDistance: '4.1 km',
      totalCost: 120,
      activities: [
        {
          id: '7',
          time: '08:00',
          type: 'meal',
          title: 'Hotel Breakfast',
          location: 'Sakura Inn',
          duration: '1 hour',
          cost: 0,
          notes: 'Included in stay'
        },
        {
          id: '8',
          time: '09:30',
          type: 'transport',
          title: 'Metro to Tokyo Skytree',
          location: 'Shinjuku → Oshiage',
          duration: '45 min',
          cost: 5,
          tips: 'Use JR Pass'
        },
        {
          id: '9',
          time: '10:30',
          type: 'attraction',
          title: 'Tokyo Skytree Observatory',
          location: 'Sumida',
          duration: '2 hours',
          cost: 25,
          tips: 'Book fast-skip tickets online'
        },
        {
          id: '10',
          time: '13:00',
          type: 'meal',
          title: 'Lunch at Skytree Town',
          location: 'Tokyo Skytree',
          duration: '1 hour',
          cost: 20,
          tips: 'Food court on 4th floor'
        },
        {
          id: '11',
          time: '15:00',
          type: 'attraction',
          title: 'Tokyo National Museum',
          location: 'Ueno',
          duration: '3 hours',
          cost: 15,
          tips: 'Audio guide recommended'
        },
        {
          id: '12',
          time: '19:00',
          type: 'attraction',
          title: 'Shibuya Crossing Experience',
          location: 'Shibuya',
          duration: '1 hour',
          cost: 0,
          tips: 'Best view from Starbucks overlooking'
        },
        {
          id: '13',
          time: '20:30',
          type: 'meal',
          title: 'Dinner at Gonpachi',
          location: 'Shibuya',
          duration: '1.5 hours',
          cost: 55,
          tips: 'Traditional Japanese ambiance'
        }
      ]
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Hotel;
      case 'attraction': return Camera;
      case 'meal': return Utensils;
      case 'transport': return MapPin;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'flight': return 'text-ai-primary';
      case 'hotel': return 'text-ai-secondary';
      case 'attraction': return 'text-ai-tertiary';
      case 'meal': return 'text-ai-warning';
      case 'transport': return 'text-ai-success';
      default: return 'text-foreground-muted';
    }
  };

  const totalCost = itineraryData.reduce((sum, day) => sum + day.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-hero text-3xl md:text-4xl">Your Perfect Tokyo Journey</h1>
        <p className="text-foreground-secondary text-lg">
          AI-crafted itinerary with optimized timing and budget
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => navigate('/my-trips')}
            className="ai-button-primary"
          >
            <Luggage className="w-4 h-4 mr-2" />
            My Trips
          </Button>
          <Button className="ai-button-secondary">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button className="ai-button-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share Trip
          </Button>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-foreground-muted mb-1">Total Duration</p>
            <p className="text-2xl font-bold text-ai-primary">4 Days</p>
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Daily Budget</p>
            <p className="text-2xl font-bold text-ai-success">${Math.round(totalCost / itineraryData.length)}</p>
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Total Walking</p>
            <p className="text-2xl font-bold text-ai-secondary">12.5 km</p>
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Activities</p>
            <p className="text-2xl font-bold text-ai-tertiary">18</p>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {itineraryData.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedDay === index
                ? 'bg-ai-primary text-white'
                : 'glass-card-secondary text-foreground-muted hover:text-foreground'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Selected Day Details */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Day {itineraryData[selectedDay].dayNumber}
            </h2>
            <p className="text-foreground-muted">{itineraryData[selectedDay].date}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-foreground-muted">
              Weather: {itineraryData[selectedDay].weather}
            </p>
            <p className="text-sm text-foreground-muted">
              Walking: {itineraryData[selectedDay].walkingDistance}
            </p>
            <p className="text-lg font-semibold text-ai-primary">
              ${itineraryData[selectedDay].totalCost}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {itineraryData[selectedDay].activities.map((activity, index) => {
            const ActivityIcon = getActivityIcon(activity.type);
            
            return (
              <div key={activity.id} className="relative">
                {/* Timeline Line */}
                {index < itineraryData[selectedDay].activities.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-background-tertiary" />
                )}
                
                <div className="flex items-start space-x-4 p-4 glass-card-secondary interactive-hover">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${
                    activity.type === 'flight' ? 'from-ai-primary/20 to-ai-primary/10' :
                    activity.type === 'hotel' ? 'from-ai-secondary/20 to-ai-secondary/10' :
                    activity.type === 'attraction' ? 'from-ai-tertiary/20 to-ai-tertiary/10' :
                    activity.type === 'meal' ? 'from-ai-warning/20 to-ai-warning/10' :
                    'from-ai-success/20 to-ai-success/10'
                  } flex items-center justify-center`}>
                    <ActivityIcon className={`w-5 h-5 ${getActivityColor(activity.type)}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{activity.title}</h3>
                        <div className="flex items-center space-x-3 text-sm text-foreground-muted">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.location}</span>
                          </span>
                          <span>Duration: {activity.duration}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
                        </div>
                      </div>
                    </div>

                    {(activity.notes || activity.tips) && (
                      <div className="space-y-2 mt-3">
                        {activity.notes && (
                          <p className="text-sm text-foreground-secondary flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-ai-success mt-0.5 flex-shrink-0" />
                            <span>{activity.notes}</span>
                          </p>
                        )}
                        {activity.tips && (
                          <p className="text-sm text-ai-primary flex items-start space-x-2">
                            <span className="text-ai-primary mt-0.5 flex-shrink-0">💡</span>
                            <span>{activity.tips}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="glass-card-secondary p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-ai-success" />
          <span>Day {itineraryData[selectedDay].dayNumber} Cost Breakdown</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {['transport', 'meal', 'attraction', 'hotel'].map((type) => {
            const typeCost = itineraryData[selectedDay].activities
              .filter(activity => activity.type === type)
              .reduce((sum, activity) => sum + activity.cost, 0);
            
            return (
              <div key={type} className="text-center p-3 rounded-lg bg-background-tertiary">
                <p className="text-foreground-muted capitalize">{type}s</p>
                <p className="font-semibold text-foreground">${typeCost}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinalItinerary;
