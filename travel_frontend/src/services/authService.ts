const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  token: string;
  user_id: number;
  username: string;
  email: string;
  message: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  profile_picture?: string;
  preferences: any;
  created_at: string;
  updated_at: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.token = response.token;
    localStorage.setItem('authToken', response.token);
    return response;
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Do not auto-login after signup; require explicit login per UX requirement
    return response;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.makeRequest('/auth/logout/', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.token = null;
    localStorage.removeItem('authToken');
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/user/profile/');
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/user/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Clear authentication state (useful for testing or manual logout)
  clearAuth(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}

export const authService = new AuthService();
