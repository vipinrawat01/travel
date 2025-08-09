
import React, { useState } from 'react';
import { Calendar, Music, Trophy, Star, MapPin, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventsService } from '@/services/eventsService';

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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const planningRaw = localStorage.getItem('tripPlanningData');
      if (!planningRaw) throw new Error('Plan trip first to fetch events');
      const planning = JSON.parse(planningRaw);
      const destination = planning.destination;
      const startDate = planning.startDate || planning.start_date;
      const endDate = planning.endDate || planning.end_date;
      if (!destination || !startDate || !endDate) throw new Error('Missing destination or dates');

      // Use destination country if present, else omit
      let countryCode: string | undefined = undefined;
      try {
        const destStr: string = String(destination);
        const parts = destStr.split(',').map((p) => p.trim());
        const last = parts[parts.length - 1];
        if (/^[A-Za-z]{2}$/.test(last)) countryCode = last.toUpperCase();
      } catch {}

      const resp = await eventsService.searchEvents({ destination, start_date: startDate, end_date: endDate, countryCode, size: 20, page: 0 });
      const data = resp.data || resp;
      const items = (data.events || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        type: 'concert',
        date: e.date,
        time: e.time,
        location: e.location,
        price: e.price || 0,
        description: e.name,
        popularity: 4.5,
        url: e.url,
      }));
      setEvents(items);
      if (items.length === 0) setError('No events found for these dates and destination.');
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Music className="w-6 h-6 text-ai-primary" />
            <h2 className="text-2xl font-semibold text-ai-accent">Local Events</h2>
          </div>
          <Button onClick={handleGenerate} className="ai-button-primary">
            <Sparkles className="w-4 h-4 mr-2" /> Generate
          </Button>
        </div>
        {loading && <div className="text-sm text-foreground-muted">Searching events...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
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
                  {event.url && (
                    <div className="mt-3">
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm ai-link">
                        View Details <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  )}
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
