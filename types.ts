
export interface LocationDetail {
  id: string;
  title: string;
  description: string;
  address?: string; // Placeholder for future
  openingHours?: string; // Placeholder for future
  mapUrl?: string;
  websiteUrl?: string;
  carNaviPhone?: string; // For Japanese Car GPS
}

export interface ItineraryEvent {
  time: string;
  description: string;
  isHighlight?: boolean; // For Red accent #C63D0F
  note?: string;
  locationId?: string; // Link to LocationDetail
}

export interface DaySchedule {
  date: string;
  weekday: string;
  title: string;
  accommodation?: string;
  accommodationMapUrl?: string; // New: Link for accommodation
  mapUrl?: string;
  events: ItineraryEvent[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  category?: string;
}

export interface ExpenseRecord {
  date: string;
  item: string;
  payer: string;
  twd: number;
  jpy: number;
  note: string;
}

export interface UsefulLink {
  title: string;
  url: string;
}

export interface EmergencyContact {
  title: string;
  number: string;
  note?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export enum Tab {
  ITINERARY = 'Itinerary',
  PREP = 'Prep',
  PACKING = 'Packing',
  COST = 'Cost',
  INFO = 'Info',
  SHOPPING = 'Shopping'
}
