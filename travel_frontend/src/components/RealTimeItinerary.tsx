import React, { useState, useEffect } from 'react';
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
  Play,
  Pause,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tripService } from '@/services/tripService';

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
  completed?: boolean;
  actualTime?: string;
  estimatedDelay?: number;
}

const RealTimeItinerary: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(false);
  const [activities, setActivities] = useState<ItineraryDay[]>([]);

  // Convert backend itinerary into local ItineraryDay shape
  const fromBackend = (data: any): ItineraryDay[] => {
    const plans = data?.day_plans || [];
    return plans.map((p: any) => ({
      date: String(p.date || ''),
      dayNumber: Number(p.day_number || 0),
      weather: String(p.weather || ''),
      walkingDistance: String(p.walking_distance || '—'),
      totalCost: Number(p.total_cost || 0),
      activities: (Array.isArray(p.activities) ? p.activities : []).map((a: any, idx: number) => ({
        id: String(idx + 1),
        time: String(a.time || '09:00'),
        type: (a.type || 'attraction') as Activity['type'],
        title: String(a.title || ''),
        location: String(a.location || ''),
        duration: String(a.duration || '1.0'),
        cost: Number(a.cost || 0),
        notes: a.notes ? String(a.notes) : undefined,
        tips: a.tips ? String(a.tips) : undefined,
        completed: false,
      })),
    }));
  };

  // Fallback mock
  const initializeActivities = (): ItineraryDay[] => [
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
          tips: 'Get JR Pass at airport counter',
          completed: false
        },
        {
          id: '2',
          time: '08:00',
          type: 'transport',
          title: 'Narita Express to Tokyo Station',
          location: 'Narita Airport → Tokyo Station',
          duration: '1 hour',
          cost: 35,
          tips: 'Reserve seats in advance',
          completed: false
        },
        {
          id: '3',
          time: '10:30',
          type: 'hotel',
          title: 'Check-in at Sakura Inn',
          location: 'Shinjuku District',
          duration: '30 min',
          cost: 0,
          notes: 'Room ready, store luggage if early',
          completed: false
        },
        {
          id: '4',
          time: '12:00',
          type: 'meal',
          title: 'Lunch at Ramen Yokocho',
          location: 'Shinjuku',
          duration: '1 hour',
          cost: 15,
          tips: 'Try the tonkotsu ramen',
          completed: false
        },
        {
          id: '5',
          time: '14:00',
          type: 'attraction',
          title: 'Senso-ji Temple Visit',
          location: 'Asakusa',
          duration: '2.5 hours',
          cost: 0,
          tips: 'Best photos in front courtyard',
          completed: false
        },
        {
          id: '6',
          time: '18:00',
          type: 'meal',
          title: 'Dinner at Izakaya Torikizoku',
          location: 'Shibuya',
          duration: '1.5 hours',
          cost: 35,
          tips: 'Try yakitori and sake pairing',
          completed: false
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
          notes: 'Included in stay',
          completed: false
        },
        {
          id: '8',
          time: '09:30',
          type: 'transport',
          title: 'Metro to Tokyo Skytree',
          location: 'Shinjuku → Oshiage',
          duration: '45 min',
          cost: 5,
          tips: 'Use JR Pass',
          completed: false
        },
        {
          id: '9',
          time: '10:30',
          type: 'attraction',
          title: 'Tokyo Skytree Observatory',
          location: 'Sumida',
          duration: '2 hours',
          cost: 25,
          tips: 'Book fast-skip tickets online',
          completed: false
        },
        {
          id: '10',
          time: '13:00',
          type: 'meal',
          title: 'Lunch at Skytree Town',
          location: 'Tokyo Skytree',
          duration: '1 hour',
          cost: 20,
          tips: 'Food court on 4th floor',
          completed: false
        },
        {
          id: '11',
          time: '15:00',
          type: 'attraction',
          title: 'Tokyo National Museum',
          location: 'Ueno',
          duration: '3 hours',
          cost: 15,
          tips: 'Audio guide recommended',
          completed: false
        },
        {
          id: '12',
          time: '19:00',
          type: 'attraction',
          title: 'Shibuya Crossing Experience',
          location: 'Shibuya',
          duration: '1 hour',
          cost: 0,
          tips: 'Best view from Starbucks overlooking',
          completed: false
        },
        {
          id: '13',
          time: '20:30',
          type: 'meal',
          title: 'Dinner at Gonpachi',
          location: 'Shibuya',
          duration: '1.5 hours',
          cost: 55,
          tips: 'Traditional Japanese ambiance',
          completed: false
        }
      ]
    }
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tripId = localStorage.getItem('currentTripId');
        if (tripId && tripId !== 'null' && tripId !== 'undefined') {
          // try fetch itinerary; if none, generate
          const existing = await tripService.getTrip(tripId);
          const existingPlans = (existing as any)?.itinerary?.day_plans;
          if (existingPlans && Array.isArray(existingPlans) && existingPlans.length > 0) {
            if (!cancelled) setActivities(fromBackend((existing as any).itinerary));
          } else {
            const gen = await tripService.generateItinerary(tripId);
            if (gen && gen.data) {
              if (!cancelled) setActivities(fromBackend(gen.data));
            }
          }
        } else {
          if (!cancelled) setActivities(initializeActivities());
        }
      } catch {
        if (!cancelled) setActivities(initializeActivities());
      }
    })();

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleRegenerate = async () => {
    try {
      const tripId = localStorage.getItem('currentTripId');
      if (!tripId || tripId === 'null' || tripId === 'undefined') return;
      const gen = await tripService.generateItinerary(tripId);
      if (gen && gen.data) setActivities(fromBackend(gen.data));
    } catch {}
  };

  const toggleActivityCompletion = (dayIndex: number, activityId: string) => {
    setActivities(prev => prev.map((day, dIndex) => {
      if (dIndex === dayIndex) {
        return {
          ...day,
          activities: day.activities.map(activity => {
            if (activity.id === activityId) {
              const completed = !activity.completed;
              const now = new Date();
              const actualTime = completed ? now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
              
              return {
                ...activity,
                completed,
                actualTime: completed ? actualTime : undefined
              };
            }
            return activity;
          })
        };
      }
      return day;
    }));

    // Auto-adjust subsequent activities if there's a delay
    if (isLive) {
      autoAdjustItinerary(dayIndex, activityId);
    }
  };

  const autoAdjustItinerary = (dayIndex: number, completedActivityId: string) => {
    const currentActivity = activities[dayIndex]?.activities.find(a => a.id === completedActivityId);
    if (!currentActivity?.actualTime) return;

    const [actualHour, actualMinute] = currentActivity.actualTime.split(':').map(Number);
    const [scheduledHour, scheduledMinute] = currentActivity.time.split(':').map(Number);
    
    const scheduledTimeInMinutes = scheduledHour * 60 + scheduledMinute + parseInt(currentActivity.duration) * 60;
    const actualTimeInMinutes = actualHour * 60 + actualMinute;
    const delayInMinutes = actualTimeInMinutes - scheduledTimeInMinutes;

    if (delayInMinutes > 15) { // Only adjust if delay is significant
      setActivities(prev => prev.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          let cumulativeAdjustment = delayInMinutes;
          
          return {
            ...day,
            activities: day.activities.map(activity => {
              const activityIndex = day.activities.findIndex(a => a.id === activity.id);
              const completedIndex = day.activities.findIndex(a => a.id === completedActivityId);
              
              if (activityIndex > completedIndex && !activity.completed) {
                const [hour, minute] = activity.time.split(':').map(Number);
                const originalTimeInMinutes = hour * 60 + minute;
                const adjustedTimeInMinutes = originalTimeInMinutes + Math.min(cumulativeAdjustment, 30); // Max 30min adjustment per activity
                
                const newHour = Math.floor(adjustedTimeInMinutes / 60);
                const newMinute = adjustedTimeInMinutes % 60;
                const newTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
                
                cumulativeAdjustment = Math.max(0, cumulativeAdjustment - 15); // Reduce adjustment for next activities
                
                return {
                  ...activity,
                  time: newTime,
                  estimatedDelay: delayInMinutes
                };
              }
              return activity;
            })
          };
        }
        return day;
      }));
    }
  };

  const getCurrentActivityStatus = (activity: Activity, dayIndex: number) => {
    if (!isLive || dayIndex !== selectedDay) return 'upcoming';
    
    const now = new Date();
    const [activityHour, activityMinute] = activity.time.split(':').map(Number);
    const activityTime = new Date();
    activityTime.setHours(activityHour, activityMinute, 0, 0);
    
    const durationInHours = parseFloat(activity.duration);
    const endTime = new Date(activityTime.getTime() + (durationInHours * 60 * 60 * 1000));
    
    if (activity.completed) return 'completed';
    if (now >= activityTime && now <= endTime) return 'current';
    if (now < activityTime) return 'upcoming';
    if (now > endTime) return 'overdue';
    
    return 'upcoming';
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-ai-success';
      case 'current': return 'text-ai-primary animate-pulse';
      case 'overdue': return 'text-ai-warning';
      default: return 'text-foreground-muted';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-ai-success/20 to-ai-success/10';
      case 'current': return 'from-ai-primary/20 to-ai-primary/10 animate-pulse';
      case 'overdue': return 'from-ai-warning/20 to-ai-warning/10';
      default: return 'from-foreground-muted/10 to-foreground-muted/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Controls */}
      <div className="text-center space-y-4">
        <h1 className="text-hero text-3xl md:text-4xl">Your Live Tokyo Journey</h1>
        <p className="text-foreground-secondary text-lg">
          Real-time itinerary with smart adjustments
        </p>
        
        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={() => setIsLive(!isLive)}
            className={isLive ? "ai-button-primary" : "ai-button-secondary"}
          >
            {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isLive ? 'Live Mode On' : 'Start Live Mode'}
          </Button>
          
          <Button className="ai-button-secondary">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button className="ai-button-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share Trip
          </Button>
          <Button onClick={handleRegenerate} className="ai-button-primary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate Itinerary
          </Button>
        </div>
      </div>

      {/* Live Status Indicator */}
      {isLive && (
        <div className="glass-card p-4 bg-gradient-to-r from-ai-primary/10 to-ai-success/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-ai-success rounded-full animate-pulse" />
              <span className="text-foreground">Live Mode Active</span>
              <span className="text-foreground-muted">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
            <div className="text-sm text-foreground-muted">
              Auto-adjusting for delays
            </div>
          </div>
        </div>
      )}

      {/* Day Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {activities.map((day, index) => (
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
      {activities[selectedDay] && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Day {activities[selectedDay].dayNumber}
              </h2>
              <p className="text-foreground-muted">{activities[selectedDay].date}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-foreground-muted">
                Weather: {activities[selectedDay].weather}
              </p>
              <p className="text-sm text-foreground-muted">
                Walking: {activities[selectedDay].walkingDistance}
              </p>
            </div>
          </div>
          
          {/* Real-time Timeline */}
          <div className="space-y-4">
            {activities[selectedDay].activities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const status = getCurrentActivityStatus(activity, selectedDay);
              
              return (
                <div key={activity.id} className="relative">
                  {/* Timeline Line */}
                  {index < activities[selectedDay].activities.length - 1 && (
                    <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                      status === 'completed' ? 'bg-ai-success' : 'bg-background-tertiary'
                    }`} />
                  )}
                  
                  <div className={`flex items-start space-x-4 p-4 glass-card-secondary interactive-hover transition-all duration-300`}>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getStatusBgColor(status)} flex items-center justify-center relative`}>
                      <ActivityIcon className={`w-5 h-5 ${getStatusColor(status)}`} />
                      
                      {/* Status indicator */}
                      <button
                        onClick={() => toggleActivityCompletion(selectedDay, activity.id)}
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${
                          activity.completed 
                            ? 'bg-ai-success' 
                            : status === 'current' 
                            ? 'bg-ai-primary animate-pulse' 
                            : status === 'overdue'
                            ? 'bg-ai-warning'
                            : 'bg-foreground-muted hover:bg-ai-primary'
                        }`}
                      >
                        {activity.completed ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : status === 'overdue' ? (
                          <AlertTriangle className="w-3 h-3 text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-semibold ${activity.completed ? 'text-foreground line-through' : 'text-foreground'}`}>
                            {activity.title}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-foreground-muted">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span className={activity.estimatedDelay ? 'line-through' : ''}>
                                {activity.time}
                              </span>
                              {activity.estimatedDelay && (
                                <span className="text-ai-warning ml-1">
                                  (Adjusted: +{activity.estimatedDelay}min)
                                </span>
                              )}
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{activity.location}</span>
                            </span>
                            <span>Duration: {activity.duration}</span>
                          </div>
                          {activity.actualTime && (
                            <div className="text-xs text-ai-success mt-1">
                              Completed at: {activity.actualTime}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
                          </div>
                          {status === 'current' && (
                            <div className="text-xs text-ai-primary font-medium animate-pulse">
                              IN PROGRESS
                            </div>
                          )}
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
      )}

      {/* Real-time Progress Summary */}
      {isLive && (
        <div className="glass-card-secondary p-6">
          <h3 className="font-semibold text-foreground mb-4">Today's Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-foreground-muted">Completed</p>
              <p className="text-2xl font-bold text-ai-success">
                {activities[selectedDay]?.activities.filter(a => a.completed).length || 0}
              </p>
            </div>
            <div>
              <p className="text-foreground-muted">Remaining</p>
              <p className="text-2xl font-bold text-ai-primary">
                {activities[selectedDay]?.activities.filter(a => !a.completed).length || 0}
              </p>
            </div>
            <div>
              <p className="text-foreground-muted">On Schedule</p>
              <p className="text-2xl font-bold text-ai-warning">
                {activities[selectedDay]?.activities.filter(a => !a.estimatedDelay).length || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeItinerary;
