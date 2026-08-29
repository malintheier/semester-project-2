export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface UserState {
  name: string;
  email: string;
  credits: number;
}

export interface MediaItem {
  url?: string;
  alt?: string;
}

export interface Bid {
  amount?: number;
}

export interface Listing {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  media?: MediaItem[];
  bids?: Bid[];
  endsAt?: string;
  seller?: {
    name?: string;
  };
}

export interface LoginResponse {
  name?: string;
  email?: string;
  credits?: number;
  accessToken?: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
