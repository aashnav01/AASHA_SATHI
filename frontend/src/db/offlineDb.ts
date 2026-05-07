import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export interface OfflineAnemiaRecord {
  id?: number;
  clientId: string;
  clientTimestamp: string;
  symptoms: string[];
  foods_consumed: string[];
  advice_given: string;
}

export interface OfflinePPDRecord {
  id?: number;
  clientId: string;
  clientTimestamp: string;
  epds_answers: number[];
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  referral_message: string;
}

export interface OfflineAlertRecord {
  id?: number;
  clientId: string;
  clientTimestamp: string;
  location: { lat: number; lng: number };
}

export interface OfflineIncentiveLog {
  id?: number;
  clientId: string;
  clientTimestamp: string;
  task_id: string;
  task_name: string;
  category: string;
  amount_earned: number;
  date_completed: string;
  status: 'pending' | 'submitted' | 'paid';
}

export interface OfflineWellnessCheckin {
  id?: number;
  clientId?: string;
  clientTimestamp?: string;
  date: string;
  mood: number; // 1-5 emoji scale
  tiredness: number; // 0-3 scale
  supervisor_support: number; // 0-3 scale
  completed_visits: number; // 0-3 scale
  overall_score?: number; // 0-9 (sum of above)
  hours_worked?: number; // 0-24 (backwards compatibility)
  overwhelmed?: boolean; // (backwards compatibility)
  sync_status?: 'pending' | 'synced';
}

export interface OfflineReferral {
  id?: number;
  clientId: string;
  clientTimestamp: string;
  patient_name: string;
  facility_id: string;
  status: 'pending' | 'transported';
  checklist: { ifa_tablets: boolean; anc_card: boolean; aadhaar: boolean; cash: boolean };
  sync_status?: 'pending' | 'synced';
}

export interface OfflineUserProfile {
  id?: number;
  state: string;
  district: string;
  selectedAt: string; // ISO timestamp
}

export interface OfflineTaskCompletion {
  id?: number;
  clientId?: string;
  clientTimestamp?: string;
  task_id: string;
  task_name: string;
  category: string;
  completed_at: string; // ISO timestamp
  date: string; // YYYY-MM-DD for grouping by day
  frequency: string;
  incentive_amount: number;
  sync_status?: 'pending' | 'synced';
}

class AshaSathiDB extends Dexie {
  unsyncedAnemia!: Table<OfflineAnemiaRecord>;
  unsyncedPPD!: Table<OfflinePPDRecord>;
  unsyncedAlerts!: Table<OfflineAlertRecord>;
  unsyncedIncentiveLogs!: Table<OfflineIncentiveLog>;
  wellnessCheckins!: Table<OfflineWellnessCheckin>;
  referrals!: Table<OfflineReferral>;
  userProfile!: Table<OfflineUserProfile>;
  taskCompletions!: Table<OfflineTaskCompletion>;

  constructor() {
    super('AshaSathiOfflineDB');
    this.version(1).stores({
      unsyncedAnemia: '++id, clientId',
      unsyncedPPD: '++id, clientId',
      unsyncedAlerts: '++id, clientId',
      unsyncedIncentiveLogs: '++id, clientId',
      wellnessCheckins: '++id, date',
      referrals: '++id, clientId',
      userProfile: '++id',
      taskCompletions: '++id, task_id, date',
    });

    // Version 2: adds clientId + sync_status indexes to wellness & taskCompletions
    this.version(2).stores({
      unsyncedAnemia: '++id, clientId',
      unsyncedPPD: '++id, clientId',
      unsyncedAlerts: '++id, clientId',
      unsyncedIncentiveLogs: '++id, clientId',
      wellnessCheckins: '++id, clientId, date, sync_status',
      referrals: '++id, clientId',
      userProfile: '++id',
      taskCompletions: '++id, clientId, task_id, date, sync_status',
    });
  }
}

export const db = new AshaSathiDB();

export function makeClientId(): string {
  return uuidv4();
}
