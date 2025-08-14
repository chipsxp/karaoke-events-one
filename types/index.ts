// ====== URL PARAMS
export type SearchParamProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// ====== USER TYPES
export type CreateUserParams = {
  clerkId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photo: string;
  role?: 'KJ' | 'Promoter' | 'KS'; // Made role optional for webhook case
  // KJ specific fields for enhanced registration
  experience?: string;
  equipment?: string[];
  genres?: string[];
  // Promoter specific fields
  venues?: string[];
  promotionExperience?: string;
  // KS specific fields
  vocalRange?: string;
  preferredGenres?: string[];
};

export type UpdateUserParams = {
  firstName: string | null;
  lastName: string | null;
  username: string;
  photo: string;
  role?: 'KJ' | 'Promoter' | 'KS';
  experience?: string;
  equipment?: string[];
  genres?: string[];
  venues?: string[];
  promotionExperience?: string;
  vocalRange?: string;
  preferredGenres?: string[];
  isHost?: boolean;
  isPromoter?: boolean;
  // Verification status fields
  kjVerificationStatus?: 'pending' | 'verified' | 'rejected';
  promoterVerificationStatus?: 'pending' | 'verified' | 'rejected';
  profileCompleted?: boolean;
};

// KJ Verification specific types
export type KJVerificationData = {
  experience: string;
  equipment: string[];
  genres: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
};

export type PromoterVerificationData = {
  venues: string[];
  promotionExperience: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
};

// ====== EVENT REGISTRATION PARAMS
export type CreateEventRegistrationParams = {
  eventId: string;
  userId: string;
  registrationType: 'interested' | 'registered';
  songRequests?: string[];
  groupSize?: number;
};

export type UpdateEventRegistrationParams = {
  registrationId: string;
  userId: string;
  songRequests?: string[];
  groupSize?: number;
  status?: 'interested' | 'pending' | 'approved' | 'rejected' | 'attended';
};

export type GetEventRegistrationsParams = {
  eventId: string;
  registrationType?: 'interested' | 'registered';
  status?: string;
  userId?: string;
};

export type EventRegistration = {
  _id: string;
  eventId: string;
  userId: string;
  registrationType: 'interested' | 'registered';
  status: 'interested' | 'pending' | 'approved' | 'rejected' | 'attended';
  approvedBy?: string;
  notes?: string;
  registeredAt: Date;
  approvedAt?: Date;
  attendedAt?: Date;
  songRequests: string[];
  groupSize: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated fields
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    emailId: string;
    photoAvatar: string;
    vocalRange?: string;
    preferredGenres?: string[];
  };
  approvedByUser?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
};

// ====== USER WITH ROLES
export type User = {
  _id: string;
  clerkId: string;
  emailId: string;
  userName: string;
  firstName: string;
  lastName: string;
  photoAvatar: string;
  role: 'KJ' | 'Promoter' | 'KS';
  isHost: boolean;
  isPromoter: boolean;
  kjVerificationStatus?: 'pending' | 'verified' | 'rejected';
  promoterVerificationStatus?: 'pending' | 'verified' | 'rejected';
  experience?: string;
  equipment?: string[];
  genres?: string[];
  venues?: string[];
  promotionExperience?: string;
  vocalRange?: string;
  preferredGenres?: string[];
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ====== EVENT PARAMS
export type CreateEventParams = {
  userId: string;
  event: {
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url?: string;
    
    // Enhanced fields for karaoke events
    capacity: number;
    registrationDeadline?: Date;
    autoApprove: boolean;
    equipment?: string[];
    songList?: string[];
    registrationSettings?: {
      allowGroupRegistration: boolean;
      maxGroupSize: number;
      requireSongRequests: boolean;
      allowSongRequests: boolean;
    };
  };
  path: string;
};

export type UpdateEventParams = {
  userId: string;
  event: {
    _id: string;
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url?: string;
    
    // Enhanced fields for karaoke events
    capacity: number;
    registrationDeadline?: Date;
    autoApprove: boolean;
    equipment?: string[];
    songList?: string[];
    registrationSettings?: {
      allowGroupRegistration: boolean;
      maxGroupSize: number;
      requireSongRequests: boolean;
      allowSongRequests: boolean;
    };
    status?: 'draft' | 'published' | 'cancelled' | 'completed';
  };
  path: string;
};

export type DeleteEventParams = {
  eventId: string;
  path: string;
};

export type GetAllEventsParams = {
  query: string;
  category: string;
  limit: number;
  page: number;
};

export type GetEventsByUserParams = {
  userId: string;
  limit?: number;
  page: number;
};

export type GetRelatedEventsByCategoryParams = {
  categoryId: string;
  eventId: string;
  limit?: number;
  page: number | string;
};

// ====== EVENT TYPE
export type Event = {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  createdAt: Date;
  startDateTime: Date;
  endDateTime: Date;
  price: string;
  isFree: boolean;
  url?: string;
  category: {
    _id: string;
    name: string;
  };
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
    isPromoter: boolean;
  };
  host: {
    _id: string;
    firstName: string;
    lastName: string;
    isHost: boolean;
  };
  
  // Enhanced fields
  capacity: number;
  registrationDeadline?: Date;
  autoApprove: boolean;
  equipment?: string[];
  songList?: string[];
  registrationSettings: {
    allowGroupRegistration: boolean;
    maxGroupSize: number;
    requireSongRequests: boolean;
    allowSongRequests: boolean;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
};

// ====== CATEGORY PARAMS
export type CreateCategoryParams = {
  name: string;
};

// ====== ORDER PARAMS
export type CheckoutOrderParams = {
  eventTitle: string;
  eventId: string;
  price: string;
  isFree: boolean;
  buyerId: string;
};

export type CreateOrderParams = {
  stripeId: string;
  eventId: string;
  buyerId: string;
  totalAmount: string;
  createdAt: Date;
};

export type GetOrdersByEventParams = {
  eventId: string;
  searchString: string;
};

export type GetOrdersByUserParams = {
  userId: string;
  limit?: number;
  page: string | number | undefined;
};

// ====== URL QUERY PARAMS
export type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

export type RemoveUrlQueryParams = {
  params: string;
  keysToRemove: string[];
};