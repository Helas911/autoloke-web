import type { VehicleCategory } from "./categories";

export type LatLng = { lat: number; lng: number };

export type Ad = {
  id: string;
  category?: VehicleCategory | string;
  type?: string;

  brand?: string;
  model?: string;

  title?: string;
  description?: string;

  year?: number;
  price?: number;

  city?: string;
  phone?: string;

  lat?: number;
  lng?: number;

  imageUrls?: string[];

  ownerUid?: string;
  ownerEmail?: string;

  createdAt?: any;
};

export type Part = {
  id: string;

  brand?: string;
  model?: string;
  title?: string;
  description?: string;

  price?: number;
  city?: string;
  phone?: string;

  lat?: number;
  lng?: number;

  imageUrls?: string[];

  ownerUid?: string;
  ownerEmail?: string;

  createdAt?: any;
};
