import { authService } from './authService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface EventItem {
  id: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
  price?: number;
  url?: string;
  image?: string;
}

class EventsService {
  async searchEvents(params: { destination: string; start_date: string; end_date: string; countryCode?: string; size?: number; page?: number; }) {
    const url = new URL(`${API_BASE_URL}/events/search/`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) url.searchParams.set(k, String(v));
    });
    const token = authService.getToken() || localStorage.getItem('authToken');
    const headers: HeadersInit = token ? { Authorization: `Token ${token}` } : {};
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }
}

export const eventsService = new EventsService();

