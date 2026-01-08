export enum BikeType {
  ROAD = 'ROAD',
  MTB = 'MTB',
  GRAVEL = 'GRAVEL',
  TRIATHLON = 'TRIATHLON'
}

export enum InspectionStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SUGGEST_ADJUSTMENT = 'SUGGEST_ADJUSTMENT'
}

export interface Geometry {
  stack: number;
  reach: number;
  topTubeLength?: number;
  seatTubeLength?: number;
}

export interface Specs {
  frameMaterial: string;
  groupset: string;
  wheelset: string;
  brakeType: 'Disc' | 'Rim';
  suspensionTravel?: string; // Optional for Road
}

export interface BikeListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice: number;
  type: BikeType;
  size: string;
  conditionScore: number; // 1-10
  inspectionStatus: InspectionStatus;
  imageUrl: string;
  location: string;
  specs: Specs;
  geometry: Geometry;
  description: string;
  sellerName: string;
  isVerified: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'GUEST' | 'BUYER' | 'SELLER' | 'INSPECTOR' | 'ADMIN';
  avatarUrl?: string;
}