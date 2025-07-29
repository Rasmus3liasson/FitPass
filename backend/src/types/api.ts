// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request/Response interfaces
export interface CreateCustomerRequest {
  email: string;
  name: string;
  userId?: string;
}

export interface CreateSubscriptionRequest {
  userId: string;
  stripePriceId: string;
  customerId?: string;
}

export interface CreatePaymentMethodRequest {
  customerId?: string;
  cardNumber?: string;
  expMonth?: number;
  expYear?: number;
  cvc?: string;
  isUserAdded?: boolean;
  userId?: string;
  email?: string;
  name?: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

export interface SetupIntentRequest {
  userId: string;
  email: string;
  name?: string;
}
