const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export type PlaceItem = {
  id: string;
  name: string;
  type?: string;
  cuisine?: string;
  price?: number | null;
  priceRange?: string | null;
  rating?: number | null;
  duration?: string | null;
  distance_km?: number | null;
  description?: string | null;
  bestTime?: string | null;
  address?: string | null;
  lat?: number | null;
  lon?: number | null;
};

async function postJson<T>(url: string, body: any): Promise<T> {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

export const placesService = {
  async attractions(params: { destination: string; limit?: number; radius_meters?: number; name?: string }) {
    return postJson<{ success: boolean; data: { items: PlaceItem[]; total: number; center: any } }>(
      `${API_BASE_URL}/places/attractions/`,
      params
    );
  },

  async food(params: { destination: string; limit?: number; radius_meters?: number; name?: string }) {
    return postJson<{ success: boolean; data: { items: PlaceItem[]; total: number; center: any } }>(
      `${API_BASE_URL}/places/food/`,
      params
    );
  },

  async transport(params: { destination: string; limit?: number; radius_meters?: number }) {
    return postJson<{ success: boolean; data: { items: PlaceItem[]; total: number; center: any } }>(
      `${API_BASE_URL}/places/transport/`,
      params
    );
  },
};

export type PlacesService = typeof placesService;


