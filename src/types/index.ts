import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: 'civic' | 'institutional';
  company?: string;
  totalInvested: number;
  badge: 'civic' | 'partner' | 'founder';
  joinedAt: Timestamp;
  votedDistrict: string | null;
}

export interface Investment {
  id: string;
  uid: string;
  email: string;
  amount: number;
  createdAt: Timestamp;
}

export interface GlobalStats {
  totalRaised: number;
  backerCount: number;
  towersCompleted: number;
  towersInProgress: number;
}

export interface PollutionAlert {
  message: string;
  active: boolean;
}

export interface District {
  id: string;
  name: string;
  nameKk: string;
  votes: number;
  lat: number;
  lng: number;
}

export interface AQIData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  co: number;
  label: string;
  color: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
