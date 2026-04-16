export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Table {
  _id: string;
  tableNumber: number;
  capacity: 2 | 4;
  isAvailable: boolean;
}

export interface Booking {
  _id: string;
  user: User;
  tables: Table[];
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  occasion: "birthday" | "anniversary" | "graduation" | "business" | "quiet" | "other";
  cakeDetails?: string;
  cakePrice?: number;
  totalAmount: number;
  complimentaryDrinks: number;
  bookingDate: string;
  bookingTime: string;
  status: "confirmed" | "cancelled";
  /** Omitted on older records — treated as paid in UI. */
  paymentStatus?: "pending_payment" | "paid";
  createdAt: string;
}

export interface BookingResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TableStats {
  total: number;
  available: number;
  booked: number;
  twoSeatersAvailable: number;
  fourSeatersAvailable: number;
}

export interface CreateBookingPayload {
  partySize: number;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  occasion: "birthday" | "anniversary" | "graduation" | "business" | "quiet" | "other";
  notes?: string;
  cakeDetails?: string;
  cakePrice?: number;
}

export interface AvailabilitySlot {
  slot: string;
  isAvailable: boolean;
  message: string;
}

export interface TableLayoutItem {
  _id: string;
  tableNumber: number;
  capacity: 2 | 4;
  state: "available" | "booked" | "selected" | "locked";
}

export interface AvailabilityResponse {
  success: boolean;
  date: string;
  partySize: number;
  slots: AvailabilitySlot[];
  layout: TableLayoutItem[];
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}
