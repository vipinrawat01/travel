
import React, { useState } from 'react';
import { Hotel, Star, MapPin, Wifi, Car, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hotelService, type HotelItem } from '@/services/hotelService';

interface Hotel {
  id: string;
  name: string;
  price: number;
  rating: number;
  location: string;
  distance: string;
  amenities: string[];
  image: string;
  priceCategory: 'budget' | 'comfort' | 'luxury';
}

interface HotelResultsProps {
  onHotelSelect: (hotel: Hotel) => void;
  selectedHotel?: Hotel | null;
}

const HotelResults: React.FC<HotelResultsProps> = ({ onHotelSelect, selectedHotel }) => {
  const [hotels, setHotels] = useState<Hotel[]>([
    {
      id: 'h1',
      name: 'Tokyo Grand Hotel',
      price: 180,
      rating: 4.8,
      location: 'Shibuya',
      distance: '0.5km from center',
      amenities: ['Free WiFi', 'Parking', 'Restaurant'],
      image: '/placeholder.svg',
      priceCategory: 'luxury'
    },
    {
      id: 'h2',
      name: 'Sakura Inn',
      price: 95,
      rating: 4.5,
      location: 'Shinjuku',
      distance: '1.2km from center',
      amenities: ['Free WiFi', 'Breakfast'],
      image: '/placeholder.svg',
      priceCategory: 'comfort'
    },
    {
      id: 'h3',
      name: 'Budget Tokyo Stay',
      price: 45,
      rating: 4.1,
      location: 'Asakusa',
      distance: '2.1km from center',
      amenities: ['Free WiFi'],
      image: '/placeholder.svg',
      priceCategory: 'budget'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'luxury': return 'text-ai-primary';
      case 'comfort': return 'text-ai-secondary';
      case 'budget': return 'text-ai-success';
      default: return 'text-foreground-muted';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return Wifi;
    if (amenity.includes('Parking')) return Car;
    if (amenity.includes('Restaurant') || amenity.includes('Breakfast')) return Coffee;
    return Hotel;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to read trip planning data for destination and dates
      const planningRaw = localStorage.getItem('tripPlanningData');
      let destination = 'Tokyo';
      let startDate = '2025-08-01';
      let endDate = '2025-08-05';
      let budgetTotal: number | undefined = undefined;
      let travelers = 1;

      if (planningRaw && planningRaw !== 'null' && planningRaw !== 'undefined') {
        try {
          const planning = JSON.parse(planningRaw);
          destination = planning.destination || destination;
          startDate = planning.startDate || planning.start_date || startDate;
          endDate = planning.endDate || planning.end_date || endDate;
          const b = planning.budget || planning.totalBudget || planning.total_budget;
          if (b) budgetTotal = Number(b);
          const t = planning.travelers || planning.numTravelers || planning.num_travelers;
          if (t) travelers = parseInt(String(t)) || 1;
        } catch {}
      }

      // Compute nights and a per-night budget per room/person heuristic
      const nights = (() => {
        try {
          const sd = new Date(startDate);
          const ed = new Date(endDate);
          const ms = ed.getTime() - sd.getTime();
          const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
          return isNaN(d) ? 1 : Math.max(d, 1);
        } catch { return 1; }
      })();

      let budgetPerNight: number | undefined = undefined;
      if (budgetTotal && budgetTotal > 0) {
        budgetPerNight = Math.floor(budgetTotal / Math.max(travelers, 1) / Math.max(nights, 1));
        // If unrealistically low, don't filter out results
        if (budgetPerNight < 30) budgetPerNight = undefined;
      }

      // Determine user country for localization
      const userCountry = await (async () => {
        try {
          const r = await fetch('https://ipapi.co/json/');
          if (r.ok) {
            const j = await r.json();
            return (j && j.country_code) ? String(j.country_code).toLowerCase() : undefined;
          }
        } catch {}
        return undefined;
      })();

      const resp = await hotelService.searchHotels({
        destination,
        check_in_date: startDate,
        check_out_date: endDate,
        adults: travelers,
        budget_max: budgetPerNight,
        country: userCountry,
      });

      const fetched: HotelItem[] = hotelService.extractHotelsFromResponse(resp);
      if (fetched.length) {
        // Map to local Hotel interface
        const mapped: Hotel[] = fetched.map((h) => {
          const computedCategory: Hotel['priceCategory'] =
            h.priceCategory ?? (h.price >= 250 ? 'luxury' : h.price >= 120 ? 'comfort' : 'budget');
          return {
            id: h.id,
            name: h.name,
            price: h.price,
            rating: h.rating,
            location: h.location,
            distance: h.distance,
            amenities: h.amenities,
            image: h.image,
            priceCategory: computedCategory,
          };
        });
        setHotels(mapped);
      } else {
        setError('No hotels found for the selected dates and destination.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Hotel className="w-6 h-6 text-ai-secondary" />
          <h2 className="text-2xl font-semibold text-ai-accent">Hotel Options</h2>
        </div>
        
        <Button
          onClick={handleGenerate}
          className="ai-button-primary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>

      <div className="space-y-4">
        {loading && <div className="text-sm text-foreground-muted">Searching hotels...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {hotels.map((hotel, index) => (
          <div
            key={hotel.id}
            className={`glass-card p-6 interactive-hover cursor-pointer transition-all animate-slide-in-up ${
              selectedHotel?.id === hotel.id ? 'ring-2 ring-ai-secondary ai-glow-secondary' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onHotelSelect(hotel)}
          >
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-lg bg-background-tertiary flex items-center justify-center">
                <Hotel className="w-8 h-8 text-foreground-muted" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{hotel.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(hotel.rating) 
                                ? 'text-ai-warning fill-current' 
                                : 'text-foreground-muted'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-foreground-muted">{hotel.rating}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(hotel.priceCategory || 'budget')}`}>
                        {(hotel.priceCategory || 'budget').charAt(0).toUpperCase() + (hotel.priceCategory || 'budget').slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-ai-secondary">${hotel.price}</div>
                    <p className="text-sm text-foreground-muted">per night</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-ai-tertiary" />
                  <span className="text-sm text-foreground-muted">{hotel.location} • {hotel.distance}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity, i) => {
                    const AmenityIcon = getAmenityIcon(amenity);
                    return (
                      <div key={i} className="flex items-center space-x-1 px-2 py-1 rounded-full bg-background-tertiary">
                        <AmenityIcon className="w-3 h-3 text-foreground-muted" />
                        <span className="text-xs text-foreground-muted">{amenity}</span>
                      </div>
                    );
                  })}
                </div>

                {selectedHotel?.id === hotel.id && (
                  <div className="mt-4 p-3 rounded-lg bg-ai-secondary/10 border border-ai-secondary/20">
                    <p className="text-sm text-ai-secondary font-medium">✓ Selected Hotel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelResults;
