import { authService } from './authService';

export interface HotelSearchParams {
  destination: string;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  adults?: number;
  currency?: string;
  country?: string;
  language?: string;
  budget_max?: number;
}

export interface HotelItem {
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

class HotelService {
  private baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  private buildHeaders() {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Token ${token}`;
    return headers;
  }

  async searchHotels(params: HotelSearchParams) {
    const res = await fetch(`${this.baseUrl}/hotels/search/`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data;
  }

  extractHotelsFromResponse(resp: any): HotelItem[] {
    if (!resp) return [];
    const data = resp.data || resp;
    const hotels = data.hotels || [];
    return hotels as HotelItem[];
  }

  getRecommendations(resp: any) {
    const data = resp.data || resp;
    return data.recommendations || {};
  }
}

export const hotelService = new HotelService();


