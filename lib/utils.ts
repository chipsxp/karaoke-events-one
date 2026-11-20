import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// URL utility functions
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string
  key: string
  value: string | null
}) {
  const currentUrl = new URLSearchParams(params)

  if (value === null) {
    currentUrl.delete(key)
  } else {
    currentUrl.set(key, value)
  }

  return `?${currentUrl.toString()}`
}

export function removeKeysFromQuery({
  params,
  keysToRemove,
}: {
  params: string
  keysToRemove: string[]
}) {
  const currentUrl = new URLSearchParams(params)

  keysToRemove.forEach((key) => {
    currentUrl.delete(key)
  })

  return `?${currentUrl.toString()}`
}

// Role-based utilities
//
// Canonical role vocabulary (Phase 1):
//   Promoter = venue owner / location host; top of the chain of command; approves KJs.
//   KJ       = Karaoke Jockey; the event host/director; approved by a Promoter;
//              approves KS registrations for their events.
//   KS       = Karaoke Singer; the customer; joins events by obtaining a ticket
//              and being approved by the event's KJ.
export type UserRole = 'KJ' | 'KS' | 'Promoter'

export interface RolePermissions {
  canCreateEvents: boolean
  canManageEvents: boolean
  canViewAllEvents: boolean
  canRegisterForEvents: boolean
  canApproveRegistrations: boolean
  canPromoteEvents: boolean
  canManageVenues: boolean
  canApproveKJs: boolean
  canManageProfile: boolean
  canAccessDashboard: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  KJ: {
    canCreateEvents: true, // gated at runtime on kjVerificationStatus === 'verified'
    canManageEvents: true,
    canViewAllEvents: true,
    canRegisterForEvents: false,
    canApproveRegistrations: true, // approves KS singers for their own events
    canPromoteEvents: false,
    canManageVenues: false,
    canApproveKJs: false,
    canManageProfile: true,
    canAccessDashboard: true,
  },
  KS: {
    canCreateEvents: false,
    canManageEvents: false,
    canViewAllEvents: true,
    canRegisterForEvents: true,
    canApproveRegistrations: false,
    canPromoteEvents: false,
    canManageVenues: false,
    canApproveKJs: false,
    canManageProfile: true,
    canAccessDashboard: true,
  },
  Promoter: {
    canCreateEvents: false,
    canManageEvents: false,
    canViewAllEvents: true,
    canRegisterForEvents: false,
    canApproveRegistrations: false,
    canPromoteEvents: true,
    canManageVenues: true, // owns/runs the location(s)
    canApproveKJs: true, // top of the chain of command
    canManageProfile: true,
    canAccessDashboard: true,
  },
}

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role]
}

export function canUserPerformAction(role: UserRole, action: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[action] || false
}

export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    // Log the error for debugging purposes
    console.error('Error:', error.message);
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('An unknown error occurred');
}

/**
 * Same logging/normalization as handleError, but ALWAYS re-throws so callers
 * (and the UI) can surface the failure. Use for mutations and authorization-
 * critical actions. Read-only queries keep using handleError + safe default
 * returns so pages degrade gracefully when data is unavailable.
 */
export function handleErrorThrow(error: unknown): never {
  throw handleError(error);
}

export function formatDateTime(dateString: string) {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }

  const formattedDateTime: string = new Date(dateString).toLocaleString('en-US', dateTimeOptions)
  const formattedDate: string = new Date(dateString).toLocaleString('en-US', dateOptions)
  const formattedTime: string = new Date(dateString).toLocaleString('en-US', timeOptions)

  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(price));
}

export const convertFileToUrl = (file: File) => {
  return URL.createObjectURL(file);
};