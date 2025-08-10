
import React, { useState } from 'react';
import { Car, Train, Bus, Bike, MapPin, Clock, DollarSign, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { placesService, type PlaceItem } from '@/services/placesService';
import { tripService } from '@/services/tripService';

interface Transport {
  id: string;
  type: 'train' | 'bus' | 'car' | 'bike';
  name: string;
  description: string;
  pricePerDay: number;
  coverage: string;
  convenience: number;
  features: string[];
  bestFor: string;
}

interface TransportResultsProps {
  onTransportSelect?: (transport: Transport[]) => void;
  selectedTransport?: string[];
}

const TransportResults: React.FC<TransportResultsProps> = ({ 
  onTransportSelect,
  selectedTransport = []
}) => {
  const [selectedTransportState, setSelectedTransportState] = useState<string[]>(selectedTransport);
  const [items, setItems] = useState<PlaceItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate cache for current destination
  React.useEffect(() => {
    try {
      const planningRaw = localStorage.getItem('tripPlanningData');
      if (!planningRaw) return;
      const planning = JSON.parse(planningRaw);
      const dest = planning.cityHint || planning.destination;
      const cacheRaw = localStorage.getItem('places_cache_transport');
      if (!cacheRaw) return;
      const cache = JSON.parse(cacheRaw);
      if (cache && cache.destination === dest && Array.isArray(cache.items)) {
        setItems(cache.items);
      }
    } catch {}
  }, []);

  // Preload selected transport from planning stages and reflect them
  React.useEffect(() => {
    const preload = async () => {
      try {
        const tid = localStorage.getItem('currentTripId');
        if (!tid) return;
        const stages = await tripService.getTripPlanningStages(tid);
        const tStage = Array.isArray(stages)
          ? stages.find((s: any) => s.stage_type === 'transport' && Array.isArray(s.selected_items))
          : null;
        if (tStage) {
          const ids = (tStage.selected_items || []).map((x: any) => x.id).filter(Boolean);
          setSelectedTransportState(ids);
          if (Array.isArray(tStage.selected_items) && tStage.selected_items.length > 0) {
            setItems((cur) => {
              const base = cur || [];
              const missing = tStage.selected_items.filter((r: any) => !(base as any[]).some((b: any) => b.id === r.id));
              return [...missing, ...base];
            });
          }
        }
      } catch {}
    };
    preload();
    const onRefresh = () => { preload(); };
    window.addEventListener('itinerary:refresh', onRefresh);
    return () => window.removeEventListener('itinerary:refresh', onRefresh);
  }, []);

  const transportOptions: any[] = [];

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'train': return Train;
      case 'bus': return Bus;
      case 'car': return Car;
      case 'bike': return Bike;
      default: return Car;
    }
  };

  const getTransportColor = (type: string) => {
    switch (type) {
      case 'train': return 'text-ai-primary';
      case 'bus': return 'text-ai-secondary';
      case 'car': return 'text-ai-tertiary';
      case 'bike': return 'text-ai-success';
      default: return 'text-foreground-muted';
    }
  };

  const toggleTransportSelection = (transportId: string) => {
    setSelectedTransportState(prev => {
      const newSelection = prev.includes(transportId) 
        ? prev.filter(id => id !== transportId)
        : [...prev, transportId];
      
      if (onTransportSelect) {
        const source = (items ?? transportOptions) as any[];
        const selectedTransportData = source.filter((t: any) => newSelection.includes(t.id));
        onTransportSelect(selectedTransportData as any);
      }
      
      return newSelection;
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems([]);
      const raw = localStorage.getItem('tripPlanningData');
      if (!raw) throw new Error('Missing trip planning data');
      const planning = JSON.parse(raw);
      let destination = planning.cityHint || planning.destination;
      let res = await placesService.transport({ destination, limit: 24, radius_meters: 5000 });
      if (!res.success || !res.data || !res.data.items) {
        throw new Error('No transport options found');
      }
      setItems(res.data.items);
      try {
        localStorage.setItem('places_cache_transport', JSON.stringify({ destination, items: res.data.items }));
      } catch {}
    } catch (e: any) {
      // Retry with simplified city token
      try {
        const raw = localStorage.getItem('tripPlanningData');
        if (!raw) throw e;
        const planning = JSON.parse(raw);
        const destRaw = planning.destination || '';
        const simpleCity = String(destRaw).split(',')[0].trim();
        if (!simpleCity) throw e;
        const res2 = await placesService.transport({ destination: simpleCity, limit: 24, radius_meters: 5000 });
        if (res2.success && res2.data && res2.data.items) {
          setItems(res2.data.items);
          setError(null);
          try {
            localStorage.setItem('places_cache_transport', JSON.stringify({ destination: simpleCity, items: res2.data.items }));
          } catch {}
        } else {
          setError(e.message || 'Failed to load transport options');
        }
      } catch (e2: any) {
        setError(e2.message || 'Failed to load transport options');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Car className="w-6 h-6 text-ai-primary" />
          <h2 className="text-2xl font-semibold text-ai-accent">Transportation Options</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-muted">
            {selectedTransportState.length} selected
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

      {loading && <div className="text-sm text-foreground-muted">Loading transportation options...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="space-y-4">
        {(items ?? transportOptions).map((transport: any, index: number) => {
          const isSelected = selectedTransportState.includes(transport.id);
          const TransportIcon = getTransportIcon(transport.type);
          
          return (
            <div
              key={transport.id}
              className={`glass-card p-6 interactive-hover cursor-pointer transition-all animate-slide-in-up ${
                isSelected ? 'ring-2 ring-ai-primary ai-glow-secondary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => toggleTransportSelection(transport.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${transport.type === 'train' ? 'ai-primary' : transport.type === 'bus' ? 'ai-secondary' : transport.type === 'car' ? 'ai-tertiary' : 'ai-success'}/20 to-${transport.type === 'train' ? 'ai-primary' : transport.type === 'bus' ? 'ai-secondary' : transport.type === 'car' ? 'ai-tertiary' : 'ai-success'}/10 flex items-center justify-center`}>
                    <TransportIcon className={`w-6 h-6 ${getTransportColor(transport.type)}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{transport.name}</h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-ai-primary border-ai-primary' 
                          : 'border-foreground-muted hover:border-ai-primary'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    
                    <p className="text-foreground-secondary mb-3">{transport.description}</p>
                    
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-ai-success" />
                          <span className="text-foreground-muted">{transport.pricePerDay ? `$${transport.pricePerDay}/day` : '—'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-ai-secondary" />
                          <span className="text-foreground-muted">{transport.address || transport.coverage}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                          <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mr-1 ${
                                i < (transport.convenience ?? 0) ? 'bg-ai-warning' : 'bg-foreground-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-foreground-muted">Convenience</span>
                      </div>
                      
                      <div className="text-foreground-muted">
                          {transport.bestFor ? `Best for: ${transport.bestFor}` : (transport.type || 'Transport')}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(transport.features || []).map((feature: string, i: number) => (
                        <div key={i} className="px-2 py-1 rounded-full bg-background-tertiary text-xs text-foreground-muted">
                          {feature}
                        </div>
                      ))}
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

export default TransportResults;
