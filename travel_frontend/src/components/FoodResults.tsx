
import React, { useState, useEffect } from 'react';
import { Utensils, MapPin, Clock, Star, DollarSign, Check, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { placesService, type PlaceItem } from '@/services/placesService';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  distance: string;
  description: string;
  specialDish: string;
  nearAttraction: string;
  averageMeal: number;
}

interface FoodResultsProps {
  onRestaurantsSelect?: (restaurants: Restaurant[]) => void;
  selectedRestaurants?: string[];
}

const FoodResults: React.FC<FoodResultsProps> = ({ 
  onRestaurantsSelect, 
  selectedRestaurants = []
}) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedRestaurantsState, setSelectedRestaurantsState] = useState<string[]>(selectedRestaurants);
  const [items, setItems] = useState<PlaceItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const planningRaw = localStorage.getItem('tripPlanningData');
      if (!planningRaw) return;
      const planning = JSON.parse(planningRaw);
      const dest = planning.cityHint || planning.destination;
      const cacheRaw = localStorage.getItem('places_cache_food');
      if (!cacheRaw) return;
      const cache = JSON.parse(cacheRaw);
      if (cache && cache.destination === dest && Array.isArray(cache.items)) {
        setItems(cache.items);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setSelectedRestaurantsState(selectedRestaurants);
  }, [selectedRestaurants]);

  const initialRestaurants: Restaurant[] = [
    {
      id: 'r1',
      name: 'Ramen Yokocho',
      cuisine: 'Japanese Ramen',
      priceRange: '$',
      rating: 4.6,
      distance: '0.3km from Senso-ji',
      description: 'Traditional ramen alley with authentic tonkotsu',
      specialDish: 'Tonkotsu Ramen',
      nearAttraction: 'Senso-ji Temple',
      averageMeal: 15
    },
    {
      id: 'r2',
      name: 'Sukiyabashi Jiro',
      cuisine: 'Sushi',
      priceRange: '$$$',
      rating: 4.9,
      distance: '2.1km from Tokyo Station',
      description: 'World-famous sushi restaurant by Jiro Ono',
      specialDish: 'Omakase Sushi',
      nearAttraction: 'Imperial Palace',
      averageMeal: 300
    },
    {
      id: 'r3',
      name: 'Gonpachi Shibuya',
      cuisine: 'Traditional Japanese',
      priceRange: '$$',
      rating: 4.4,
      distance: '0.1km from Shibuya Crossing',
      description: 'Rustic izakaya with Kill Bill movie atmosphere',
      specialDish: 'Yakitori & Sake',
      nearAttraction: 'Shibuya Crossing',
      averageMeal: 55
    },
    {
      id: 'r4',
      name: 'Tempura Kondo',
      cuisine: 'Tempura',
      priceRange: '$$',
      rating: 4.7,
      distance: '1.5km from Tokyo Skytree',
      description: 'Michelin-starred tempura with seasonal vegetables',
      specialDish: 'Vegetable Tempura Course',
      nearAttraction: 'Tokyo Skytree',
      averageMeal: 85
    }
  ];

  const additionalRestaurants: Restaurant[] = [
    {
      id: 'r5',
      name: 'Tsukiji Sushi Dai',
      cuisine: 'Sushi',
      priceRange: '$$',
      rating: 4.5,
      distance: '0.2km from Tsukiji Market',
      description: 'Fresh sushi at the famous fish market',
      specialDish: 'Tuna Sashimi Set',
      nearAttraction: 'Tsukiji Outer Market',
      averageMeal: 45
    },
    {
      id: 'r6',
      name: 'Nabezo Shibuya',
      cuisine: 'Shabu-shabu',
      priceRange: '$$',
      rating: 4.3,
      distance: '0.5km from Shibuya',
      description: 'All-you-can-eat shabu-shabu with premium beef',
      specialDish: 'Wagyu Shabu-shabu',
      nearAttraction: 'Meiji Shrine',
      averageMeal: 38
    },
    {
      id: 'r7',
      name: 'Robot Restaurant',
      cuisine: 'Entertainment Dining',
      priceRange: '$$',
      rating: 4.2,
      distance: '1.2km from Shinjuku',
      description: 'Futuristic dining with robot performances',
      specialDish: 'Bento Box & Show',
      nearAttraction: 'Shinjuku District',
      averageMeal: 65
    },
    {
      id: 'r8',
      name: 'Kozasa',
      cuisine: 'Kaiseki',
      priceRange: '$$$',
      rating: 4.8,
      distance: '2.3km from Imperial Palace',
      description: 'Traditional multi-course Japanese haute cuisine',
      specialDish: 'Seasonal Kaiseki',
      nearAttraction: 'Imperial Palace Gardens',
      averageMeal: 180
    }
  ];

  const allRestaurants = showMore ? [...initialRestaurants, ...additionalRestaurants] : initialRestaurants;

  const toggleRestaurantSelection = (restaurantId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedRestaurantsState(prev => {
      const newSelection = prev.includes(restaurantId) 
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId];
      
      if (onRestaurantsSelect) {
        const source = (items ?? allRestaurants) as any[];
        const selectedRestaurantsData = source.filter((r: any) => newSelection.includes(r.id));
        onRestaurantsSelect(selectedRestaurantsData as any);
      }
      
      return newSelection;
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = localStorage.getItem('tripPlanningData');
      if (!raw) throw new Error('Missing trip planning data');
      const planning = JSON.parse(raw);
      let destination = planning.cityHint || planning.destination;
      let res = await placesService.food({ destination, limit: 24, radius_meters: 15000 });
      if (!res.success || !res.data || !res.data.items) {
        throw new Error('No restaurants found');
      }
      setItems(res.data.items);
      try {
        localStorage.setItem('places_cache_food', JSON.stringify({ destination, items: res.data.items }));
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
        const res2 = await placesService.food({ destination: simpleCity, limit: 24, radius_meters: 15000 });
        if (res2.success && res2.data && res2.data.items) {
          setItems(res2.data.items);
          setError(null);
        } else {
          setError(e.message || 'Failed to load restaurants');
        }
      } catch (e2: any) {
        setError(e2.message || 'Failed to load restaurants');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Utensils className="w-6 h-6 text-ai-warning" />
          <h2 className="text-2xl font-semibold text-ai-accent">Food & Restaurants</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-muted">
            {selectedRestaurantsState.length} selected
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

      {loading && <div className="text-sm text-foreground-muted">Loading restaurants...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(items ?? allRestaurants).map((restaurant: any, index: number) => {
          const isSelected = selectedRestaurantsState.includes(restaurant.id);
          
          return (
            <div
              key={restaurant.id}
              className={`glass-card-secondary p-5 interactive-hover animate-slide-in-up transition-all duration-300 ${
                isSelected ? 'ring-2 ring-ai-warning ai-glow-secondary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-ai-warning fill-current" />
                        <span className="text-sm text-foreground-muted">{restaurant.rating ?? '—'}</span>
                      </div>
                      <button
                        onClick={(e) => toggleRestaurantSelection(restaurant.id, e)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                          isSelected 
                            ? 'bg-ai-warning border-ai-warning' 
                            : 'border-foreground-muted hover:border-ai-warning'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-ai-warning">{restaurant.cuisine || restaurant.type}</p>
                    <span className="text-foreground-muted">•</span>
                    <p className="text-sm text-foreground-muted">{restaurant.priceRange}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary mb-2">{restaurant.description}</p>
              <p className="text-sm text-ai-primary mb-4">Specialty: {restaurant.specialDish}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-ai-success" />
                  <span className="text-foreground-muted">{restaurant.averageMeal ? `$${restaurant.averageMeal}` : '—'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-ai-secondary" />
                  <span className="text-foreground-muted">{restaurant.address || `${restaurant.distance_km ?? '—'} km`}</span>
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ai-primary" />
                  <span className="text-foreground-muted">{restaurant.nearAttraction ? `Near ${restaurant.nearAttraction}` : '—'}</span>
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
            Show More Restaurants
          </Button>
        </div>
      )}
    </div>
  );
};

export default FoodResults;
