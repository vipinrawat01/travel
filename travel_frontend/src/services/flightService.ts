import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults?: number;
  cabin_class?: string;
  preferences?: {
    max_budget?: number;
    max_stops?: number;
    preferred_airlines?: string[];
  };
}

export interface Flight {
  id: string;
  airline: string;
  price: number;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  type?: string;
  layovers?: any[];
  raw_data?: any;
}

export interface FlightSearchResponse {
  success: boolean;
  data?: {
    flights?: Flight[];
    recommendations?: {
      best_value?: Flight;
      fastest?: Flight;
      most_convenient?: Flight;
    };
    total_flights?: number;
    price_range?: {
      lowest: number;
      highest: number;
    };
    summary?: string;
  };
  error?: string;
  raw_response?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
}

class FlightService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
    try {
      const response = await this.makeRequest<FlightSearchResponse>('/flights/search/', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      return response;
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  async getAirportSuggestions(query: string): Promise<Airport[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; airports: Airport[] }>(
        `/flights/airports/?q=${encodeURIComponent(query)}`
      );
      
      return response.airports || [];
    } catch (error) {
      console.error('Error getting airport suggestions:', error);
      return [];
    }
  }

  // Helper method to extract flights from AI response
  extractFlightsFromResponse(response: FlightSearchResponse): Flight[] {
    if (!response.success) {
      return [];
    }

    // Try to extract flights from different possible response structures
    if (response.data?.flights && Array.isArray(response.data.flights)) {
      return response.data.flights;
    }

    // If the response contains raw flight data in a different format
    if (response.raw_response) {
      try {
        // First try direct JSON
        const parsed = JSON.parse(response.raw_response);
        if (parsed.flights && Array.isArray(parsed.flights)) {
          return parsed.flights;
        }
      } catch (e) {
        // Attempt to extract a JSON block from a mixed text response
        try {
          const match = response.raw_response.match(/\{[\s\S]*\}/);
          if (match && match[0]) {
            const parsedBlock = JSON.parse(match[0]);
            if (parsedBlock.flights && Array.isArray(parsedBlock.flights)) {
              return parsedBlock.flights;
            }
          }
        } catch {}
        // Non-JSON freeform response (e.g., "unable to find flights"). Not an error, just no parsable flights.
      }

      // Heuristic: parse markdown/narrative lists like "1. **Airline** - Price: $..."
      const fromText = this.parseFlightsFromText(response.raw_response);
      if (fromText.length > 0) return fromText;
    }

    return [];
  }

  // Helper method to get recommendations from AI response
  getRecommendations(response: FlightSearchResponse) {
    if (!response.success || !response.data) {
      return null;
    }

    return response.data.recommendations || null;
  }

  // Helper to surface a user-friendly message when no flights are returned
  getMessageFromResponse(response: FlightSearchResponse): string | null {
    if (response.error) return response.error;
    const summary = response.data?.summary;
    if (summary && typeof summary === 'string') return summary;
    if (response.raw_response && typeof response.raw_response === 'string') {
      const trimmed = response.raw_response.trim();
      // Return only the first sentence/line to avoid overwhelming the UI
      const firstLine = trimmed.split('\n')[0];
      const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0];
      return firstSentence || trimmed.slice(0, 160);
    }
    return null;
  }

  private parseFlightsFromText(raw: string): Flight[] {
    try {
      const flights: Flight[] = [];
      const normalized = raw.replace(/\r\n/g, '\n');
      const header = normalized.split('\n')[0] || '';
      // Try to infer IATA codes from header line (e.g., JFK) and parentheses (e.g., (IXC))
      const originMatch = header.match(/\b[A-Z]{3}\b/);
      const destMatch = header.match(/\(([A-Z]{3})\)/);
      const inferredOrigin = originMatch ? originMatch[0] : '';
      const inferredArrival = destMatch ? destMatch[1] : '';

      const sectionRegex = new RegExp('^\n?\s*\d+\.\s+\*\*(.*?)\*\*([\\s\\S]*?)(?=^\s*\d+\.\s+\*\*|$)', 'gm');
      let m: RegExpExecArray | null;
      while ((m = sectionRegex.exec(normalized)) !== null) {
        const airline = (m[1] || 'Unknown').trim();
        const body = m[2] || '';

        const priceMatch = body.match(/Price:\s*\$([0-9,]+)/i);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;

        const depMatch = body.match(/Departure:\s*([^\n]+?)(?:\sat\s([0-9:apm\s]+))?\b/i);
        const arrMatch = body.match(/Arrival:\s*([^\n]+?)(?:\sat\s([0-9:apm\s]+))?\b/i);
        const departureTime = depMatch && depMatch[2] ? depMatch[2].trim() : (depMatch ? depMatch[1].trim() : '');
        const arrivalTime = arrMatch && arrMatch[2] ? arrMatch[2].trim() : (arrMatch ? arrMatch[1].trim() : '');

        const durationMatch = body.match(/Duration:\s*([0-9]+h\s*[0-9]*m?)/i);
        const duration = durationMatch ? durationMatch[1].replace(/\s+/g, ' ') : '';

        const stopsMatch = body.match(/Stops:\s*(\d+)/i);
        const stops = stopsMatch ? parseInt(stopsMatch[1], 10) : 0;

        // Layovers list (optional)
        const layovers: any[] = [];
        const layoverBlockMatch = body.match(/Layovers?:[\s\S]*?(?=\n\s*\n|$)/i);
        if (layoverBlockMatch) {
          const lines = layoverBlockMatch[0].split('\n');
          for (const line of lines) {
            const lm = line.match(/-\s+(.+?)(?:\s+-\s+([0-9h\s]*m))?$/);
            if (lm) {
              layovers.push({ location: lm[1].trim(), duration: (lm[2] || '').trim() });
            }
          }
        }

        const id = `nl_${flights.length}_${airline.replace(/\s+/g, '')}`;
        flights.push({
          id,
          airline,
          price,
          departure: inferredOrigin,
          arrival: inferredArrival,
          duration: duration || 'Unknown',
          stops,
          departureTime: departureTime || 'Unknown',
          arrivalTime: arrivalTime || 'Unknown',
          layovers,
        });
      }
      return flights;
    } catch {
      return [];
    }
  }
}

export const flightService = new FlightService();
