import { BikeListing, BikeType, InspectionStatus } from './types';

// API Configuration
const VITE_API_URL = (import.meta as any).env.VITE_API_URL;
export const API_BASE_URL = VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  FACEBOOK_LOGIN: `${API_BASE_URL}/auth/facebook`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
  
  // Listings
  LISTINGS: `${API_BASE_URL}/listings`,
  LISTINGS_SEARCH: `${API_BASE_URL}/listings/search`,
  
  // User
  PROFILE: `${API_BASE_URL}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
};

export const MOCK_LISTINGS: BikeListing[] = [
  {
    id: '1',
    title: 'Specialized S-Works Tarmac SL7 - Dura Ace Di2',
    brand: 'Specialized',
    model: 'Tarmac SL7',
    year: 2022,
    price: 185000000,
    originalPrice: 280000000,
    type: BikeType.ROAD,
    size: '54',
    conditionScore: 9.2,
    inspectionStatus: InspectionStatus.PASSED,
    imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=1000',
    location: 'Ho Chi Minh City',
    specs: {
      frameMaterial: 'Carbon FACT 12r',
      groupset: 'Shimano Dura-Ace Di2 R9200',
      wheelset: 'Roval Rapide CLX',
      brakeType: 'Disc'
    },
    geometry: {
      stack: 534,
      reach: 387,
      topTubeLength: 540
    },
    description: 'Chiếc xe đua đỉnh cao, đã được kiểm định kỹ lưỡng. Không có vết nứt (hairline crack). Xích mới thay.',
    sellerName: 'Nguyen Van A',
    isVerified: true
  },
  {
    id: '2',
    title: 'Santa Cruz Megatower CC X01',
    brand: 'Santa Cruz',
    model: 'Megatower',
    year: 2023,
    price: 145000000,
    originalPrice: 210000000,
    type: BikeType.MTB,
    size: 'M',
    conditionScore: 8.5,
    inspectionStatus: InspectionStatus.PASSED,
    imageUrl: 'https://images.unsplash.com/photo-1576435728678-38d01d52e38b?auto=format&fit=crop&q=80&w=1000',
    location: 'Hanoi',
    specs: {
      frameMaterial: 'Carbon CC',
      groupset: 'SRAM X01 Eagle',
      wheelset: 'Reserve 30 Carbon',
      brakeType: 'Disc',
      suspensionTravel: '170mm F/165mm R'
    },
    geometry: {
      stack: 615,
      reach: 450
    },
    description: 'Máy ủi địa hình. Phuộc đã bảo dưỡng. Có trầy xước nhẹ ở chainstay nhưng không ảnh hưởng kết cấu.',
    sellerName: 'Tran Van B',
    isVerified: true
  },
  {
    id: '3',
    title: 'Cervélo P5 Disc Force eTap',
    brand: 'Cervélo',
    model: 'P5',
    year: 2021,
    price: 160000000,
    originalPrice: 240000000,
    type: BikeType.TRIATHLON,
    size: '51',
    conditionScore: 9.8,
    inspectionStatus: InspectionStatus.PENDING,
    imageUrl: 'https://images.unsplash.com/photo-1599552683573-9dc48255b7ef?auto=format&fit=crop&q=80&w=1000',
    location: 'Da Nang',
    specs: {
      frameMaterial: 'Carbon',
      groupset: 'SRAM Force eTap AXS',
      wheelset: 'Reserve 50/65',
      brakeType: 'Disc'
    },
    geometry: {
      stack: 480,
      reach: 395
    },
    description: 'Xe trùm mền, mới chạy giải Ironman 70.3 một lần. Còn bảo hành chính hãng.',
    sellerName: 'Le Thi C',
    isVerified: false
  }
];

export const BRANDS = ['Specialized', 'Trek', 'Cervélo', 'Pinarello', 'Colnago', 'Santa Cruz', 'Giant'];