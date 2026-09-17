export type BlockType = 'A' | 'B' | 'C' | 'C2';

export type FloorNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type RoomCount = 1 | 2 | 3 | 4;

export type CreditPeriod = 12 | 24 | 36 | 48 | 60;

export interface Apartment {
  id: string;
  apartmentNumber: string;
  block: BlockType;
  floor: number;
  rooms: number;
  area: number; // m2
  view?: string; // Görüntü: 'Həyət' | 'Park' | 'Ə.Mehbalıyev' | digər
  cashPricePerM2: number; // AZN
  credit12PricePerM2: number; // AZN
  credit24PricePerM2: number; // AZN
  credit36PricePerM2: number; // AZN
  credit48PricePerM2: number; // AZN
  credit60PricePerM2: number; // AZN
  customInitialPaymentPercent?: number; // Optional override
  notes?: string;
  createdAt?: string;
}

export interface CreditCalculation {
  periodMonths: CreditPeriod;
  pricePerM2: number;
  totalPrice: number;
  initialPaymentPercent: number;
  initialPaymentAmount: number;
  remainingBalance: number;
  monthlyPayment: number;
}

export interface ApartmentCalculations {
  apartment: Apartment;
  cashTotalPrice: number;
  credits: Record<CreditPeriod, CreditCalculation>;
}

export interface FilterState {
  block: string; // 'all' | 'A' | 'B' | 'C' | 'C2'
  floor: string; // 'all' | '2'..'10'
  rooms: string; // 'all' | '1'..'4'
  view: string; // 'all' | 'Həyət' | 'Park' | 'Ə.Mehbalıyev'
  minArea: string;
  maxArea: string;
  searchQuery: string;
  activePeriod: 'all' | CreditPeriod;
  initialPaymentPercent: number; // default e.g. 20%
}
