
import React from 'react';
import { Calendar, Music, Trophy, Star, MapPin, Clock } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  type: 'festival' | 'sports' | 'concert' | 'exhibition';
  date: string;
  time: string;
  location: string;
  price: number;
  description: string;
  popularity: number;
}

const EventsResults: React.FC = () => {
  const events: Event[] = [
    {
      id: 'e1',
      name: 'Tokyo Winter Illumination Festival',
      type: 'festival',
      date: 'Dec 15 - Jan 15',
      time: '17:00 - 22:00',
      location: 'Roppongi Hills',
      price: 0,
      description: 'Spectacular winter light displays across the city',
      popularity: 4.8
    },
    {
      id: 'e2',
      name: 'J-League Championship Final',
      type: 'sports',
      date: 'Dec 18',
      time: '19:00',
      location: 'Tokyo Stadium',
      price: 45,
      description: 'Final match of Japan\'s premier football league',
      popularity: 4.5
    },
    {
      id: 'e3',
      name: 'Tokyo Jazz Festival',
      type: 'concert',
      date: 'Dec 20-22',
      time: '19:30',
      location: 'Blue Note Tokyo',
      price: 85,
      description: 'International jazz artists performing live',
      popularity: 4.7
    },
    {
      id: 'e4',
      name: 'Digital Art Exhibition',
      type: 'exhibition',
      date: 'Ongoing',
      time: '10:00 - 20:00',
      location: 'teamLab Borderless',
      price: 35,
      description: 'Immersive digital art and interactive installations',
      popularity: 4.9
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'festival': return Calendar;
      case 'sports': return Trophy;
      case 'concert': return Music;
      case 'exhibition': return Star;
      default: return Calendar;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'festival': return 'text-ai-warning';
      case 'sports': return 'text-ai-success';
      case 'concert': return 'text-ai-primary';
      case 'exhibition': return 'text-ai-tertiary';
      default: return 'text-foreground-muted';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <Music className="w-6 h-6 text-ai-primary" />
        <h2 className="text-2xl font-semibold text-ai-accent">Local Events</h2>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => {
          const EventIcon = getEventIcon(event.type);
          
          return (
            <div
              key={event.id}
              className="glass-card p-6 interactive-hover animate-slide-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br from-${event.type === 'festival' ? 'ai-warning' : event.type === 'sports' ? 'ai-success' : event.type === 'concert' ? 'ai-primary' : 'ai-tertiary'}/20 to-transparent`}>
                  <EventIcon className={`w-6 h-6 ${getTypeColor(event.type)}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{event.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)} bg-current/10`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-ai-warning fill-current" />
                          <span className="text-sm text-foreground-muted">{event.popularity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-ai-primary">
                        {event.price === 0 ? 'Free' : `$${event.price}`}
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground-secondary mb-4">{event.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-ai-secondary" />
                      <span className="text-foreground-muted">{event.date}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-ai-tertiary" />
                      <span className="text-foreground-muted">{event.time}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-ai-primary" />
                      <span className="text-foreground-muted">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsResults;
