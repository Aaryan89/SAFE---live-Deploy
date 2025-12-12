export enum AppMode {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  EMERGENCY = 'EMERGENCY',
  PRE_ALERT = 'PRE_ALERT',
  DISCREET = 'DISCREET',
}

export enum GuardianState {
  MONITORING = 'MONITORING',
  VERIFYING_SILENT = 'VERIFYING_SILENT',
  VERIFYING_SOS = 'VERIFYING_SOS',
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  fullName: string;
  safeword: string;
  contacts: EmergencyContact[];
  frequentLocations?: string[];
  isSetupComplete: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
}

export interface EmergencyPacket {
  id: string;
  timestamp: string;
  user: UserProfile;
  location: LocationData | null;
  status: string;
  batteryLevel: number;
  aiAnalysis?: string;
}

export enum ThreatLevel {
  NONE = 'NONE',
  SUSPICIOUS = 'SUSPICIOUS',
  DANGER = 'DANGER',
  CRITICAL = 'CRITICAL',
}