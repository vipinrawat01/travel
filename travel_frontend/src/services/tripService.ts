import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface TripData {
  title: string;
  destination: string;
  description?: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  travel_style: string;
  image_url?: string;
}

export interface TripItemData {
  item_type: 'flight' | 'hotel' | 'attraction' | 'restaurant' | 'transport' | 'activity' | 'event';
  name: string;
  description?: string;
  price: number;
  currency?: string;
  booking_reference?: string;
  external_id?: string;
  metadata?: any;
  is_selected?: boolean;
}

export interface Trip {
  id: string;
  user_username: string;
  title: string;
  destination: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  travel_style: string;
  status: string;
  image_url?: string;
  duration_days: number;
  items: TripItem[];
  budget_info: any;
  itinerary: any;
  created_at: string;
  updated_at: string;
}

export interface TripItem {
  id: string;
  item_type: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  booking_reference: string;
  external_id: string;
  metadata: any;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

class TripService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = authService.getToken();
    console.log('Debug - Auth token:', token ? 'Present' : 'Missing');
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    console.log('Debug - Final headers:', headers);
    return headers;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Handle empty/void responses (e.g., DELETE 204) gracefully
      const status = response.status;
      const contentType = response.headers.get('content-type') || '';
      if (status === 204 || contentType.indexOf('application/json') === -1) {
        // Try to read text; if empty, return undefined as any
        const text = await response.text().catch(() => '');
        if (!text) {
          console.log('Debug - API Response (no content):', { url, method: options.method || 'GET', status });
          return undefined as unknown as T;
        }
        try {
          const parsed = JSON.parse(text);
          console.log('Debug - API Response (json via text):', { url, method: options.method || 'GET', data: parsed });
          return parsed as T;
        } catch {
          console.log('Debug - API Response (non-json text):', { url, method: options.method || 'GET', status });
          return undefined as unknown as T;
        }
      }

      const responseData = await response.json();
      console.log('Debug - API Response:', { url, method: options.method || 'GET', data: responseData });
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Create a new trip
  async createTrip(tripData: TripData): Promise<Trip> {
    console.log('Debug - Creating trip with data:', tripData);
    console.log('Debug - Headers:', this.getHeaders());
    
    const response = await this.makeRequest<Trip>(`${API_BASE_URL}/trips/`, {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
    
    console.log('Debug - createTrip response:', response);
    return response;
  }

  // Get all trips for the authenticated user (handles paginated or array responses)
  async getTrips(): Promise<Trip[]> {
    const resp = await this.makeRequest<any>(`${API_BASE_URL}/trips/`);
    return Array.isArray(resp) ? resp as Trip[] : (resp?.results ?? []) as Trip[];
  }

  // Get a specific trip by ID
  async getTrip(tripId: string): Promise<Trip> {
    return this.makeRequest<Trip>(`${API_BASE_URL}/trips/${tripId}/`);
  }

  async generateItinerary(tripId: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/itinerary/generate/`, {
      method: 'POST',
    });
  }

  // Update a trip
  async updateTrip(tripId: string, tripData: Partial<TripData>): Promise<Trip> {
    return this.makeRequest<Trip>(`${API_BASE_URL}/trips/${tripId}/`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  }

  // Delete a trip
  async deleteTrip(tripId: string): Promise<void> {
    return this.makeRequest<void>(`${API_BASE_URL}/trips/${tripId}/`, {
      method: 'DELETE',
    });
  }

  // Add a trip item
  async addTripItem(tripId: string, itemData: TripItemData): Promise<TripItem> {
    return this.makeRequest<TripItem>(`${API_BASE_URL}/trips/${tripId}/items/`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // Get all items for a trip
  async getTripItems(tripId: string): Promise<TripItem[]> {
    const response = await this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/items/`);
    // Handle paginated response
    return response.results || response;
  }

  // Update a trip item
  async updateTripItem(tripId: string, itemId: string, itemData: Partial<TripItemData>): Promise<TripItem> {
    return this.makeRequest<TripItem>(`${API_BASE_URL}/trips/${tripId}/items/${itemId}/`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  // Delete a trip item
  async deleteTripItem(tripId: string, itemId: string): Promise<void> {
    return this.makeRequest<void>(`${API_BASE_URL}/trips/${tripId}/items/${itemId}/`, {
      method: 'DELETE',
    });
  }

  // Select/deselect a trip item
  async selectTripItem(tripId: string, itemId: string): Promise<{ message: string; is_selected: boolean }> {
    return this.makeRequest<{ message: string; is_selected: boolean }>(
      `${API_BASE_URL}/trips/${tripId}/items/${itemId}/select/`
    );
  }

  // Get trip summary
  async getTripSummary(tripId: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/summary/`);
  }

  // Get user dashboard data
  async getDashboardData(): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/user/dashboard/`);
  }

  // Trip Planning Stage methods
  async getTripPlanningStages(tripId: string): Promise<any[]> {
    return this.makeRequest<any[]>(`${API_BASE_URL}/trips/${tripId}/planning-stages/`);
  }

  async getTripPlanningStage(tripId: string, stageId: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageId}/`);
  }

  async createTripPlanningStage(tripId: string, stageData: {
    stage_type: string;
    selected_items?: any[];
    ai_options?: any[];
    stage_preferences?: any;
    notes?: string;
  }): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/`, {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
  }

  async updateTripPlanningStage(tripId: string, stageId: string, stageData: Partial<{
    status: string;
    selected_items: any[];
    ai_options: any[];
    stage_preferences: any;
    notes: string;
  }>): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageId}/`, {
      method: 'PUT',
      body: JSON.stringify(stageData),
    });
  }

  async deleteTripPlanningStage(tripId: string, stageId: string): Promise<void> {
    return this.makeRequest<void>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageId}/`, {
      method: 'DELETE',
    });
  }

  async getTripPlanningProgress(tripId: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-progress/`);
  }

  async updateTripPlanningProgress(tripId: string, stagesData: any[]): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-progress/`, {
      method: 'POST',
      body: JSON.stringify({ stages: stagesData }),
    });
  }

  async updatePlanningStage(tripId: string, stageType: string, stageData: any): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageType}/update/`, {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
  }

  async markStageCompleted(tripId: string, stageType: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageType}/complete/`, {
      method: 'POST',
    });
  }

  async markStageSkipped(tripId: string, stageType: string): Promise<any> {
    return this.makeRequest<any>(`${API_BASE_URL}/trips/${tripId}/planning-stages/${stageType}/skip/`, {
      method: 'POST',
    });
  }

  // Save complete trip with all selected items
  async saveCompleteTrip(
    tripData: TripData,
    selectedItems: {
      flight?: any;
      hotel?: any;
      attractions?: any[];
      restaurants?: any[];
      transport?: any[];
    },
    existingTripId?: string
  ): Promise<Trip> {
    let trip: Trip;
    let tripId: string;
    
    console.log('Debug - saveCompleteTrip called with existingTripId:', existingTripId);
    
    if (existingTripId && existingTripId !== 'undefined' && existingTripId !== 'null') {
      // Update existing trip
      console.log('Debug - Updating existing trip with ID:', existingTripId);
      trip = await this.updateTrip(existingTripId, tripData);
      tripId = trip.id || existingTripId; // Use trip.id if available, otherwise fallback to existingTripId
      console.log('Debug - Updated trip result:', trip);
      console.log('Debug - Using tripId for clearing items:', tripId);
      
      // Clear existing items for this trip
      const existingItems = await this.getTripItems(tripId);
      console.log('Debug - Found existing items to clear:', existingItems);
      
      for (const item of existingItems) {
        await this.deleteTripItem(tripId, item.id);
      }
    } else {
      // Create new trip
      console.log('Debug - Creating new trip');
      trip = await this.createTrip(tripData);
      tripId = trip.id;
      console.log('Debug - Created trip with ID:', tripId);
    }

    // Then add all selected items
    const itemPromises: Promise<any>[] = [];
    const safeId = (val: any) => String(val || '').slice(0, 100);
    const sanitize = (obj: any): any => {
      try {
        if (!obj || typeof obj !== 'object') return obj;
        const out: any = Array.isArray(obj) ? [] : {};
        const keys = Object.keys(obj);
        for (const k of keys) {
          const v = (obj as any)[k];
          if (v === undefined || typeof v === 'function') continue;
          if (v && typeof v === 'object') {
            out[k] = sanitize(v);
          } else if (typeof v === 'string') {
            out[k] = v.length > 500 ? v.slice(0, 500) : v;
          } else {
            out[k] = v;
          }
        }
        return out;
      } catch {
        return undefined;
      }
    };
    const pick = (obj: any, fields: string[]): any => {
      const res: any = {};
      for (const f of fields) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, f)) res[f] = obj[f];
      }
      return res;
    };

    console.log('Debug - Adding items to trip with ID:', tripId);

    // Add flight
    if (selectedItems.flight) {
      itemPromises.push(
        this.addTripItem(tripId, {
          item_type: 'flight',
          name: String(selectedItems.flight.airline || selectedItems.flight.name || 'Flight'),
          description: `Flight to ${tripData.destination}`,
          price: Number(selectedItems.flight.price ?? 0) || 0,
          currency: 'USD',
          external_id: safeId(selectedItems.flight.id),
          metadata: sanitize(pick(selectedItems.flight, [
            'id','airline','price','duration','stops','departure','arrival','departureTime','arrivalTime','bookingUrl'
          ])),
          is_selected: true,
        }).catch(err => {
          console.warn('addTripItem flight failed; continuing', err);
        })
      );
    }

    // Add hotel
    if (selectedItems.hotel) {
      itemPromises.push(
        this.addTripItem(tripId, {
          item_type: 'hotel',
          name: String(selectedItems.hotel.name || 'Hotel'),
          description: `Hotel in ${tripData.destination}`,
          price: Number(selectedItems.hotel.price ?? 0) || 0,
          currency: 'USD',
          external_id: safeId(selectedItems.hotel.id),
          metadata: sanitize(pick(selectedItems.hotel, [
            'id','name','price','rating','location','distance','amenities','image','priceCategory'
          ])),
          is_selected: true,
        }).catch(err => {
          console.warn('addTripItem hotel failed; continuing', err);
        })
      );
    }

    // Add attractions
    if (selectedItems.attractions && selectedItems.attractions.length > 0) {
      selectedItems.attractions.forEach((attraction: any) => {
        itemPromises.push(
          this.addTripItem(tripId, {
            item_type: 'attraction',
            name: String(attraction.name || 'Attraction'),
            description: String(attraction.description || `Attraction in ${tripData.destination}`),
            price: Number(attraction.price ?? 0) || 0,
            currency: 'USD',
            external_id: safeId(attraction.id),
            metadata: sanitize(pick(attraction, [
              'id','name','type','address','lat','lon','distance_km','duration','bestTime'
            ])),
            is_selected: true,
          }).catch(err => {
            console.warn('addTripItem attraction failed; continuing', err);
          })
        );
      });
    }

    // Add restaurants
    if (selectedItems.restaurants && selectedItems.restaurants.length > 0) {
      selectedItems.restaurants.forEach((restaurant: any) => {
        itemPromises.push(
          this.addTripItem(tripId, {
            item_type: 'restaurant',
            name: String(restaurant.name || 'Restaurant'),
            description: String(restaurant.description || `Restaurant in ${tripData.destination}`),
            price: Number(restaurant.price ?? 0) || 0,
            currency: 'USD',
            external_id: safeId(restaurant.id),
            metadata: sanitize(pick(restaurant, [
              'id','name','cuisine','priceRange','rating','address','lat','lon','distance_km'
            ])),
            is_selected: true,
          }).catch(err => {
            console.warn('addTripItem restaurant failed; continuing', err);
          })
        );
      });
    }

    // Add transport
    if (selectedItems.transport && selectedItems.transport.length > 0) {
      selectedItems.transport.forEach((transport: any) => {
        itemPromises.push(
          this.addTripItem(tripId, {
            item_type: 'transport',
            name: String(transport.name || 'Transport'),
            description: String(transport.description || `Transport in ${tripData.destination}`),
            price: Number(transport.price ?? 0) || 0,
            currency: 'USD',
            external_id: safeId(transport.id),
            metadata: sanitize(pick(transport, [
              'id','name','type','address','lat','lon','distance_km','name_native','coverage'
            ])),
            is_selected: true,
          }).catch(err => {
            console.warn('addTripItem transport failed; continuing', err);
          })
        );
      });
    }

    // Wait for all items to be created
    if (itemPromises.length > 0) {
      console.log('Debug - Creating', itemPromises.length, 'trip items');
      await Promise.all(itemPromises);
      console.log('Debug - All trip items created successfully');
    }

    // Return the complete trip with items
    console.log('Debug - Returning complete trip with ID:', tripId);
    // Sync planning stages with selected items for reliable reload
    try {
      const toStage = (items: any[] | undefined) => Array.isArray(items) ? items : [];
      const stagesPayload = [
        { stage_type: 'flight', status: selectedItems.flight ? 'completed' : 'pending', selected_items: toStage(selectedItems.flight ? [selectedItems.flight] : []) },
        { stage_type: 'hotel', status: selectedItems.hotel ? 'completed' : 'pending', selected_items: toStage(selectedItems.hotel ? [selectedItems.hotel] : []) },
        { stage_type: 'attractions', status: selectedItems.attractions && selectedItems.attractions.length ? 'completed' : 'pending', selected_items: toStage(selectedItems.attractions) },
        { stage_type: 'food', status: selectedItems.restaurants && selectedItems.restaurants.length ? 'completed' : 'pending', selected_items: toStage(selectedItems.restaurants) },
        { stage_type: 'transport', status: selectedItems.transport && selectedItems.transport.length ? 'completed' : 'pending', selected_items: toStage(selectedItems.transport) },
      ];
      await this.updateTripPlanningProgress(tripId, stagesPayload);
    } catch (e) {
      // Non-fatal; proceed to return trip
      console.warn('Failed to sync planning stages; continuing', e);
    }

    return this.getTrip(tripId);
  }
}

export const tripService = new TripService();
