
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Clock, Star, DollarSign, Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { placesService, type PlaceItem } from '@/services/placesService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { tripService } from '@/services/tripService';

interface Attraction {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: string;
  rating: number;
  distance: string;
  description: string;
  bestTime: string;
}

interface AttractionsResultsProps {
  onAttractionsSelect?: (attractions: Attraction[]) => void;
  selectedAttractions?: string[];
}

const AttractionsResults: React.FC<AttractionsResultsProps> = ({ 
  onAttractionsSelect,
  selectedAttractions = []
}) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedAttractionsState, setSelectedAttractionsState] = useState<string[]>(selectedAttractions);
  const [items, setItems] = useState<PlaceItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [guideData, setGuideData] = useState<any | null>(null);

  // Rehydrate last generated results for current destination from localStorage
  useEffect(() => {
    try {
      const planningRaw = localStorage.getItem('tripPlanningData');
      if (!planningRaw) return;
      const planning = JSON.parse(planningRaw);
      const dest = planning.cityHint || planning.destination;
      const cacheRaw = localStorage.getItem('places_cache_attractions');
      if (!cacheRaw) return;
      const cache = JSON.parse(cacheRaw);
      if (cache && cache.destination === dest && Array.isArray(cache.items)) {
        setItems(cache.items);
      }
    } catch {}
  }, []);

  // Preload selected attractions from planning stages and reflect them as selected badges
  useEffect(() => {
    const preload = async () => {
      try {
        const tid = localStorage.getItem('currentTripId');
        if (!tid) return;
        const stages = await tripService.getTripPlanningStages(tid);
        const attractionsStage = Array.isArray(stages)
          ? stages.find((s: any) => s.stage_type === 'attractions' && Array.isArray(s.selected_items))
          : null;
        if (attractionsStage) {
          const ids = (attractionsStage.selected_items || []).map((x: any) => x.id).filter(Boolean);
          setSelectedAttractionsState(ids);
          // Also ensure items list contains them so they render visible
          if (Array.isArray(attractionsStage.selected_items) && attractionsStage.selected_items.length > 0) {
            setItems((cur) => {
              const base = cur || [];
              const missing = attractionsStage.selected_items.filter((a: any) => !(base as any[]).some((b: any) => b.id === a.id));
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

  useEffect(() => {
    setSelectedAttractionsState(selectedAttractions);
  }, [selectedAttractions]);

  const initialAttractions: Attraction[] = [
    {
      id: 'a1',
      name: 'Senso-ji Temple',
      type: 'Cultural',
      price: 0,
      duration: '2-3 hours',
      rating: 4.7,
      distance: '0.8km walk',
      description: 'Ancient Buddhist temple in Asakusa district',
      bestTime: 'Early morning'
    },
    {
      id: 'a2',
      name: 'Tokyo Skytree',
      type: 'Observation',
      price: 25,
      duration: '1-2 hours',
      rating: 4.5,
      distance: '1.5km walk',
      description: 'Iconic tower with panoramic city views',
      bestTime: 'Sunset'
    },
    {
      id: 'a3',
      name: 'Shibuya Crossing',
      type: 'Experience',
      price: 0,
      duration: '30 min',
      rating: 4.6,
      distance: '2.1km by metro',
      description: 'World\'s busiest pedestrian crossing',
      bestTime: 'Evening rush hour'
    },
    {
      id: 'a4',
      name: 'Tokyo National Museum',
      type: 'Museum',
      price: 15,
      duration: '2-4 hours',
      rating: 4.4,
      distance: '3.2km by metro',
      description: 'Largest collection of Japanese art and artifacts',
      bestTime: 'Weekday mornings'
    }
  ];

  const additionalAttractions: Attraction[] = [
    {
      id: 'a5',
      name: 'Meiji Shrine',
      type: 'Cultural',
      price: 0,
      duration: '1-2 hours',
      rating: 4.5,
      distance: '2.8km by metro',
      description: 'Serene Shinto shrine dedicated to Emperor Meiji',
      bestTime: 'Morning'
    },
    {
      id: 'a6',
      name: 'Tsukiji Outer Market',
      type: 'Food & Culture',
      price: 0,
      duration: '2-3 hours',
      rating: 4.3,
      distance: '3.5km by metro',
      description: 'Famous fish market with street food and shops',
      bestTime: 'Early morning'
    },
    {
      id: 'a7',
      name: 'Imperial Palace Gardens',
      type: 'Nature',
      price: 0,
      duration: '1-2 hours',
      rating: 4.2,
      distance: '4.1km by metro',
      description: 'Beautiful gardens surrounding the Imperial Palace',
      bestTime: 'Spring & Fall'
    },
    {
      id: 'a8',
      name: 'TeamLab Borderless',
      type: 'Art & Technology',
      price: 45,
      duration: '3-4 hours',
      rating: 4.8,
      distance: '8.5km by train',
      description: 'Immersive digital art experience',
      bestTime: 'Evening'
    }
  ];

  const allAttractions = showMore ? [...initialAttractions, ...additionalAttractions] : initialAttractions;

  const toggleAttractionSelection = (attractionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedAttractionsState(prev => {
      const newSelection = prev.includes(attractionId) 
        ? prev.filter(id => id !== attractionId)
        : [...prev, attractionId];
      
      if (onAttractionsSelect) {
        const source = (items ?? allAttractions) as any[];
        const selectedAttractionsData = source.filter((a: any) => newSelection.includes(a.id));
        onAttractionsSelect(selectedAttractionsData as any);
      }
      
      return newSelection;
    });
  };

  const openGuide = async (attraction: any) => {
    try {
      setGuideOpen(true);
      setGuideLoading(true);
      setGuideError(null);
      setGuideData(null);
      const planningRaw = localStorage.getItem('tripPlanningData');
      const planning = planningRaw ? JSON.parse(planningRaw) : {};
      const city = planning.cityHint || planning.destination || '';
      const res = await placesService.placeGuide({ name: String(attraction.name || ''), city });
      if (res && (res as any).success && (res as any).data) {
        setGuideData((res as any).data);
      } else {
        setGuideError('Failed to generate guide');
      }
    } catch (e: any) {
      setGuideError(e?.message || 'Failed to generate guide');
    } finally {
      setGuideLoading(false);
    }
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
      let res = await placesService.attractions({ destination, limit: 24, radius_meters: 20000 });
      if (!res.success || !res.data || !res.data.items) {
        throw new Error('No attractions found');
      }
      setItems(res.data.items);
      // Cache for this destination
      try {
        localStorage.setItem('places_cache_attractions', JSON.stringify({ destination, items: res.data.items }));
      } catch {}
    } catch (e: any) {
      // Retry with simplified city token if geocoding failed
      try {
        const raw = localStorage.getItem('tripPlanningData');
        if (!raw) throw e;
        const planning = JSON.parse(raw);
        const destRaw = planning.destination || '';
        const simpleCity = String(destRaw).split(',')[0].trim();
        if (!simpleCity) throw e;
        const res2 = await placesService.attractions({ destination: simpleCity, limit: 24, radius_meters: 20000 });
        if (res2.success && res2.data && res2.data.items) {
          setItems(res2.data.items);
          setError(null);
        } else {
          setError(e.message || 'Failed to load attractions');
        }
      } catch (e2: any) {
        setError(e2.message || 'Failed to load attractions');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Camera className="w-6 h-6 text-ai-tertiary" />
          <h2 className="text-2xl font-semibold text-ai-accent">Top Attractions</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-muted">
            {selectedAttractionsState.length} selected
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

      {loading && <div className="text-sm text-foreground-muted">Loading attractions...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(items ?? allAttractions).map((attraction: any, index: number) => {
          const isSelected = selectedAttractionsState.includes(attraction.id);
          
          return (
            <div
              key={attraction.id}
              className={`glass-card-secondary p-5 interactive-hover animate-slide-in-up transition-all duration-300 ${
                isSelected ? 'ring-2 ring-ai-primary ai-glow-secondary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onDoubleClick={() => openGuide(attraction)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{attraction.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-ai-warning fill-current" />
                        <span className="text-sm text-foreground-muted">{(attraction as any).rating}</span>
                      </div>
                      <button
                        onClick={(e) => toggleAttractionSelection(attraction.id, e)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                          isSelected 
                            ? 'bg-ai-primary border-ai-primary' 
                            : 'border-foreground-muted hover:border-ai-primary'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-ai-tertiary">{(attraction as any).type}</p>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary mb-4">{(attraction as any).description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-ai-success" />
                  <span className="text-foreground-muted">
                    {(attraction as any).price === 0 ? 'Free' : `$${(attraction as any).price}`}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ai-primary" />
                  <span className="text-foreground-muted">{(attraction as any).duration}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-ai-secondary" />
                  <span className="text-foreground-muted">{(attraction as any).distance}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-ai-tertiary" />
                  <span className="text-foreground-muted">{(attraction as any).bestTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showMore && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowMore(true)}
            className="ai-button-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Show More Attractions
          </Button>
        </div>
      )}

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{guideData?.place?.name || 'Place Guide'}</DialogTitle>
            <DialogDescription>
              {guideData?.place?.city ? `${guideData.place.city}${guideData?.place?.country ? ', ' + guideData.place.country : ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          {guideLoading && (
            <div className="text-sm text-foreground-muted">Generating guide...</div>
          )}
          {guideError && (
            <div className="text-sm text-destructive">{guideError}</div>
          )}
          {!guideLoading && !guideError && guideData && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {guideData.place?.summary && (
                <div>
                  <div className="font-semibold mb-1">Overview</div>
                  <div className="text-sm text-foreground-muted">{guideData.place.summary}</div>
                </div>
              )}
              {guideData.bestTimes && (
                <div>
                  <div className="font-semibold mb-1">Best Times</div>
                  <div className="text-sm text-foreground-muted">{guideData.bestTimes.overall}</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-foreground-muted">
                    {(guideData.bestTimes.byTimeOfDay || []).slice(0, 6).map((t: any, i: number) => (
                      <li key={i}><span className="font-medium">{t.time}:</span> {t.whatToExpect}{t.tips ? ` — ${t.tips}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {guideData.photoGuide && (
                <div>
                  <div className="font-semibold mb-1">Photo Guide</div>
                  <div className="text-sm text-foreground-muted">Best times: {guideData.photoGuide.bestTimes || '—'}</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-foreground-muted">
                    {(guideData.photoGuide.bestSpots || []).slice(0, 6).map((s: any, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(guideData.highlights) && guideData.highlights.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Highlights</div>
                  <ul className="list-disc pl-5 text-sm text-foreground-muted">
                    {guideData.highlights.slice(0, 8).map((h: any, i: number) => (
                      <li key={i}><span className="font-medium">{h.title}:</span> {h.description}</li>
                    ))}
                  </ul>
                </div>
              )}
              {guideData.practicalInfo && (
                <div>
                  <div className="font-semibold mb-1">Practical Info</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground-muted">
                    <div>Opening Hours: {guideData.practicalInfo.openingHours || '—'}</div>
                    <div>Typical Duration: {guideData.practicalInfo.duration || '—'}</div>
                    <div>Tickets: {guideData.practicalInfo.tickets?.required || 'Unknown'}{guideData.practicalInfo.tickets?.price ? ` • ${guideData.practicalInfo.tickets.price}` : ''}</div>
                    <div>Buy: {guideData.practicalInfo.tickets?.whereToBuy || '—'}</div>
                    <div>How to Reach: {guideData.practicalInfo.howToReach || '—'}</div>
                    <div>Accessibility: {guideData.practicalInfo.accessibility || '—'}</div>
                    <div>Safety: {guideData.practicalInfo.safety || '—'}</div>
                    <div>Etiquette: {guideData.practicalInfo.etiquette || '—'}</div>
                  </div>
                </div>
              )}
              {Array.isArray(guideData.nearby) && guideData.nearby.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Nearby</div>
                  <ul className="list-disc pl-5 text-sm text-foreground-muted">
                    {guideData.nearby.slice(0, 6).map((n: any, i: number) => (
                      <li key={i}><span className="font-medium">{n.name}</span>{n.distance ? ` • ${n.distance}` : ''}{n.whyVisit ? ` — ${n.whyVisit}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttractionsResults;
