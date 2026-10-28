export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "owner" | "staff";
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "user" | "admin" | "owner" | "staff";
  isPhoneVerified?: boolean;
  totalBookings?: number;
  venueBookings?: number;
  lastBookingDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UsersResponse {
  success: boolean;
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  counts: {
    totalUsers: number;
    verifiedUsers: number;
    adminUsers: number;
  };
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

export interface QuoteHistoryItem {
  action: "inquiry_created" | "quote_sent" | "quote_accepted" | "quote_rejected" | "menu_updated";
  actor: "admin" | "user";
  actorName?: string;
  price?: number;
  notes?: string;
  cateringMenu?: string;
  dishes?: string[];
  createdAt: string;
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
  paymentStatus?: "pending_payment" | "paid" | "deposit_paid";
  bookingType: "standard" | "private_event";
  depositAmount?: number;
  remainingAmount?: number;
  remainingPaymentStatus?: "unpaid" | "paid";
  durationHours?: number;
  needDj?: boolean;
  needPhotographer?: boolean;
  photographerHours?: number;
  cateringMenu?: string;
  offerPrice?: number;
  negotiationNotes?: string;
  offerStatus?: "pending" | "offered" | "accepted" | "declined";
  foodBasePrice?: number;
  foodServiceFee?: number;
  foodPaymentStatus?: "unpaid" | "paid" | "pending_verification";
  foodPaymentMethod?: "card" | "zelle";
  foodZelleProofUrl?: string;
  foodPaidAt?: string;
  quoteHistory?: QuoteHistoryItem[];
  paymentMethod?: "card" | "zelle" | "cash" | "bank_transfer" | "other";
  paymentBreakdown?: Array<{
    _id?: string;
    amount: number;
    paymentMethod: "card" | "zelle" | "cash" | "bank_transfer" | "other";
    paymentType: "deposit" | "balance_partial" | "balance_full" | "food_catering" | "manual";
    status: "verified" | "pending";
    transactionId?: string;
    proofUrl?: string;
    iterationIndex?: number;
    notes?: string;
    paidAt: string;
  }>;
  zelleProofUrl?: string;
  remainingZelleProofUrl?: string;
  zelleVerificationStatus?: "none" | "pending_ghl_verification" | "verified" | "mismatched" | "manual_review";
  remainingZelleVerificationStatus?: "none" | "pending_ghl_verification" | "verified" | "mismatched" | "manual_review";
  zelleTransactionId?: string;
  zelleNotes?: string;
  zelleUploadedAt?: string;
  isManualBooking?: boolean;
  manualCreatedBy?: string;
  paymentDueDate?: string;
  contractedAmount?: number;
  collectedAmount?: number;
  outstandingBalance?: number;
  eventEndTime?: string;
  rescheduledAt?: string;
  rescheduleCount?: number;
  previousBookingDate?: string;
  previousBookingTime?: string;
  marketingConsent?: boolean;
  marketingConsentAt?: string;
  guestMedia?: Array<{
    url: string;
    publicId?: string;
    mediaType: "photo" | "video";
    originalName?: string;
    sizeBytes?: number;
    uploadedAt: string;
  }>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

export interface BookingResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
  counts?: {
    all: number;
    leads: number;
    bookings: number;
    cancelled: number;
  };
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

export interface Coupon {
  _id: string;
  code: string;
  promoterName: string;
  promoterEmail?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  usageCount: number;
  isActive: boolean;
  expiryDate?: string;
  createdAt: string;
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
