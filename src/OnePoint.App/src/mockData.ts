// Hardcoded demo data for OnePoint MVP — no API calls

export interface ConsumerProfile {
  id: string;
  phoneNumber: string;
  displayName: string;
  onepointBalance: number;
  qrCodeData: string;
  isActive: boolean;
}

export interface PartnerBalance {
  programId: string;
  programName: string;
  cachedBalance: number;
}

export interface RedemptionTransaction {
  id: string;
  transactionRef: string;
  merchantName: string;
  merchantLocation: string;
  pointsRedeemed: number;
  monetaryValue: number;
  method: 'QR_Code' | 'User_ID';
  status: 'approved' | 'pending' | 'failed' | 'reversed';
  createdAt: string;
}

export interface Promotion {
  id: string;
  merchantName: string;
  description: string;
  category: string;
  requiredPoints: number;
  termsConditions: string;
  validFrom: string;
  validUntil: string;
}

export interface Notification {
  id: string;
  category: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const MOCK_CONSUMER: ConsumerProfile = {
  id: 'ONEPOINT-USR-00001',
  phoneNumber: '+66812345678',
  displayName: 'Somchai Demo',
  onepointBalance: 12450,
  qrCodeData: 'ONEPOINT-USR-00001',
  isActive: true,
};

export const MOCK_PARTNERS: PartnerBalance[] = [
  { programId: 'lazada', programName: 'Lazada', cachedBalance: 3200 },
  { programId: 'central', programName: 'Central', cachedBalance: 1800 },
  { programId: 'the1', programName: 'The1', cachedBalance: 5400 },
];

export const MOCK_TRANSACTIONS: RedemptionTransaction[] = [
  { id: '1', transactionRef: 'TXN-20250101-001', merchantName: 'CentralWorld', merchantLocation: 'Ratchaprasong, Bangkok', pointsRedeemed: 500, monetaryValue: 50, method: 'QR_Code', status: 'approved', createdAt: '2025-01-15T14:30:00Z' },
  { id: '2', transactionRef: 'TXN-20250101-002', merchantName: 'Siam Paragon', merchantLocation: 'Siam, Bangkok', pointsRedeemed: 1200, monetaryValue: 120, method: 'User_ID', status: 'approved', createdAt: '2025-01-14T10:15:00Z' },
  { id: '3', transactionRef: 'TXN-20250101-003', merchantName: 'Terminal 21', merchantLocation: 'Asoke, Bangkok', pointsRedeemed: 300, monetaryValue: 30, method: 'QR_Code', status: 'approved', createdAt: '2025-01-13T18:45:00Z' },
  { id: '4', transactionRef: 'TXN-20250101-004', merchantName: 'EmQuartier', merchantLocation: 'Phrom Phong, Bangkok', pointsRedeemed: 800, monetaryValue: 80, method: 'QR_Code', status: 'approved', createdAt: '2025-01-12T09:00:00Z' },
  { id: '5', transactionRef: 'TXN-20250101-005', merchantName: 'ICON Siam', merchantLocation: 'Charoen Nakhon, Bangkok', pointsRedeemed: 2000, monetaryValue: 200, method: 'User_ID', status: 'approved', createdAt: '2025-01-11T16:20:00Z' },
  { id: '6', transactionRef: 'TXN-20250101-006', merchantName: 'MBK Center', merchantLocation: 'National Stadium, Bangkok', pointsRedeemed: 150, monetaryValue: 15, method: 'QR_Code', status: 'approved', createdAt: '2025-01-10T12:00:00Z' },
  { id: '7', transactionRef: 'TXN-20250101-007', merchantName: 'Mega Bangna', merchantLocation: 'Bangna, Bangkok', pointsRedeemed: 950, monetaryValue: 95, method: 'QR_Code', status: 'approved', createdAt: '2025-01-09T11:30:00Z' },
  { id: '8', transactionRef: 'TXN-20250101-008', merchantName: 'CentralWorld', merchantLocation: 'Ratchaprasong, Bangkok', pointsRedeemed: 400, monetaryValue: 40, method: 'User_ID', status: 'approved', createdAt: '2025-01-08T15:45:00Z' },
  { id: '9', transactionRef: 'TXN-20250101-009', merchantName: 'Siam Discovery', merchantLocation: 'Siam, Bangkok', pointsRedeemed: 600, monetaryValue: 60, method: 'QR_Code', status: 'approved', createdAt: '2025-01-07T13:10:00Z' },
  { id: '10', transactionRef: 'TXN-20250101-010', merchantName: 'The Mall Bangkapi', merchantLocation: 'Bangkapi, Bangkok', pointsRedeemed: 350, monetaryValue: 35, method: 'QR_Code', status: 'approved', createdAt: '2025-01-06T17:00:00Z' },
  { id: '11', transactionRef: 'TXN-20250101-011', merchantName: 'Platinum Mall', merchantLocation: 'Pratunam, Bangkok', pointsRedeemed: 700, monetaryValue: 70, method: 'User_ID', status: 'approved', createdAt: '2025-01-05T10:30:00Z' },
  { id: '12', transactionRef: 'TXN-20250101-012', merchantName: 'Terminal 21', merchantLocation: 'Asoke, Bangkok', pointsRedeemed: 250, monetaryValue: 25, method: 'QR_Code', status: 'approved', createdAt: '2025-01-04T14:00:00Z' },
];

export const MOCK_PROMOTIONS: Promotion[] = [
  { id: '1', merchantName: 'CentralWorld', description: '2x points on all purchases this weekend', category: 'Shopping', requiredPoints: 0, termsConditions: 'Valid for in-store purchases only. Cannot be combined with other offers.', validFrom: '2025-01-15', validUntil: '2025-03-15' },
  { id: '2', merchantName: 'Siam Paragon', description: 'Redeem 500 points for ฿100 food court voucher', category: 'Food', requiredPoints: 500, termsConditions: 'One voucher per customer per day. Valid at all food court outlets.', validFrom: '2025-01-01', validUntil: '2025-02-28' },
  { id: '3', merchantName: 'ICON Siam', description: 'Free parking with 1000+ point redemption', category: 'Lifestyle', requiredPoints: 1000, termsConditions: 'Up to 3 hours free parking. Present receipt at parking counter.', validFrom: '2025-01-10', validUntil: '2025-04-10' },
  { id: '4', merchantName: 'EmQuartier', description: '15% bonus points on fashion purchases', category: 'Shopping', requiredPoints: 0, termsConditions: 'Applicable to fashion floor tenants only.', validFrom: '2025-01-20', validUntil: '2025-03-20' },
  { id: '5', merchantName: 'Terminal 21', description: 'Spend 2000 points, get ฿500 gift card', category: 'Shopping', requiredPoints: 2000, termsConditions: 'Gift card valid for 30 days from issuance.', validFrom: '2025-01-05', validUntil: '2025-02-05' },
  { id: '6', merchantName: 'MBK Center', description: 'Double points on electronics', category: 'Electronics', requiredPoints: 0, termsConditions: 'Valid on 4th and 5th floor electronics shops.', validFrom: '2025-01-12', validUntil: '2025-03-12' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', category: 'transaction', title: 'Points Redeemed', body: 'You redeemed 500 points at CentralWorld.', isRead: false, createdAt: '2025-01-15T14:30:00Z' },
  { id: '2', category: 'promotion', title: 'New Promotion', body: 'Siam Paragon: Redeem 500 points for ฿100 food court voucher!', isRead: false, createdAt: '2025-01-14T09:00:00Z' },
  { id: '3', category: 'points', title: 'Points Earned', body: 'You earned 200 points from your purchase at EmQuartier.', isRead: false, createdAt: '2025-01-13T18:00:00Z' },
  { id: '4', category: 'transaction', title: 'Points Redeemed', body: 'You redeemed 1,200 points at Siam Paragon.', isRead: true, createdAt: '2025-01-12T10:15:00Z' },
  { id: '5', category: 'promotion', title: 'Weekend Deal', body: 'CentralWorld: 2x points on all purchases this weekend!', isRead: true, createdAt: '2025-01-11T08:00:00Z' },
  { id: '6', category: 'points', title: 'Points Earned', body: 'You earned 350 points from your purchase at Terminal 21.', isRead: true, createdAt: '2025-01-10T16:30:00Z' },
  { id: '7', category: 'transaction', title: 'Points Redeemed', body: 'You redeemed 2,000 points at ICON Siam.', isRead: true, createdAt: '2025-01-09T16:20:00Z' },
];

// Conversion rates for swap preview (partner → OnePoint only)
export const MOCK_CONVERSION_RATES: Record<string, { toOnepoint: number; fromOnepoint: number }> = {
  lazada: { toOnepoint: 0.85, fromOnepoint: 1.15 },
  central: { toOnepoint: 0.90, fromOnepoint: 1.10 },
  the1: { toOnepoint: 1.0, fromOnepoint: 1.0 },
  grab: { toOnepoint: 0.80, fromOnepoint: 1.20 },
  ktc: { toOnepoint: 0.75, fromOnepoint: 1.30 },
};

// Available partner programs for swap (system-enabled)
export interface LinkedProgram {
  programId: string;
  programName: string;
  rateToOnepoint: number;
  icon: string;
}

export const MOCK_AVAILABLE_PROGRAMS: LinkedProgram[] = [
  { programId: 'lazada', programName: 'Lazada', rateToOnepoint: 0.85, icon: 'lazada' },
  { programId: 'grab', programName: 'Grab', rateToOnepoint: 0.80, icon: 'grab' },
  { programId: 'the1', programName: 'The1', rateToOnepoint: 1.0, icon: 'the1' },
  { programId: 'ktc', programName: 'KTC Point', rateToOnepoint: 0.75, icon: 'ktc' },
];

// Swap transaction history
export interface SwapTransaction {
  id: string;
  sourceProgram: string;
  sourceAmount: number;
  onepointAmount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export const MOCK_SWAP_TRANSACTIONS: SwapTransaction[] = [
  { id: 's1', sourceProgram: 'Lazada', sourceAmount: 1000, onepointAmount: 850, status: 'completed', createdAt: '2025-01-15T10:00:00Z' },
  { id: 's2', sourceProgram: 'The1', sourceAmount: 2000, onepointAmount: 2000, status: 'completed', createdAt: '2025-01-13T14:30:00Z' },
  { id: 's3', sourceProgram: 'Grab', sourceAmount: 500, onepointAmount: 400, status: 'completed', createdAt: '2025-01-10T09:15:00Z' },
  { id: 's4', sourceProgram: 'KTC Point', sourceAmount: 3000, onepointAmount: 2250, status: 'completed', createdAt: '2025-01-08T16:45:00Z' },
];

// Combined recent activity for home screen
export interface RecentActivity {
  id: string;
  type: 'redeem' | 'swap' | 'earn';
  description: string;
  points: number;
  createdAt: string;
}

export const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  { id: 'r1', type: 'redeem', description: 'Redeemed at CentralWorld', points: -500, createdAt: '2025-01-15T14:30:00Z' },
  { id: 'r2', type: 'swap', description: 'Swapped from Lazada', points: 850, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'r3', type: 'earn', description: 'Earned at EmQuartier', points: 200, createdAt: '2025-01-13T18:00:00Z' },
  { id: 'r4', type: 'swap', description: 'Swapped from The1', points: 2000, createdAt: '2025-01-13T14:30:00Z' },
  { id: 'r5', type: 'redeem', description: 'Redeemed at Siam Paragon', points: -1200, createdAt: '2025-01-12T10:15:00Z' },
  { id: 'r6', type: 'earn', description: 'Earned at Terminal 21', points: 350, createdAt: '2025-01-10T16:30:00Z' },
  { id: 'r7', type: 'swap', description: 'Swapped from Grab', points: 400, createdAt: '2025-01-10T09:15:00Z' },
  { id: 'r8', type: 'redeem', description: 'Redeemed at ICON Siam', points: -2000, createdAt: '2025-01-09T16:20:00Z' },
];
