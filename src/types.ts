export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface UserState {
  name: string;
  email: string;
  credits: number;
  fullName?: string;
  avatarUrl?: string;
}

export interface MediaItem {
  url?: string;
  alt?: string;
}

export interface Bid {
  id?: string;
  amount?: number;
  created?: string;
  listing?: Listing;
  bidder?: {
    name?: string;
  };
}

export interface Listing {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  media?: MediaItem[];
  bids?: Bid[];
  created?: string;
  updated?: string;
  endsAt?: string;
  seller?: {
    name?: string;
  };
  _count?: {
    bids?: number;
  };
}

export interface Profile {
  name: string;
  email: string;
  bio?: string;
  avatar?: MediaItem;
  banner?: MediaItem;
  credits?: number;
  listings?: Listing[];
  _count?: {
    listings?: number;
    wins?: number;
  };
}

export interface LoginResponse {
  name?: string;
  email?: string;
  credits?: number;
  accessToken?: string;
}

export interface ApiKey {
  key: string;
  name: string;
  status: string;
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
