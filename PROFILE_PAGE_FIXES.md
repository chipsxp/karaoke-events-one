# Profile Page Fixes - Next.js App Router Event Handler Error

## Problem Summary

The profile page (`app/(root)/profile/page.tsx`) was experiencing a critical Next.js App Router error:

```
⨯ Error: Event handlers cannot be passed to Client Component props.
  <button className=... onClick={function onClick} children=...>   
                                ^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>)
    at stringify (<anonymous>)
digest: "3550839742"
 GET /profile 500 in 567ms
```

## Root Cause Analysis

### Primary Issue: Server Component with Event Handlers
- The `app/(root)/profile/page.tsx` file was a **Server Component** (no "use client" directive)
- It contained multiple `Button` components with `onClick` handlers
- In Next.js App Router, **Server Components cannot have event handlers**

### Affected Components
The following buttons had onClick handlers causing the error:
1. **Welcome Banner Button** - Navigate to events (`/#events`)
2. **Edit Profile Button** - Navigate to profile edit (`/profile/edit`)
3. **Explore Events Button** - Navigate to events (`/#events`)
4. **View Details Buttons** (2x) - Navigate to event details (`/events/${eventId}`)
5. **Browse Events Button** - Navigate to events (`/#events`)
6. **Create New Event Button** - Navigate to create event (`/events/create`)

## Solution Implementation

### Strategy: Client Component Separation
Following Next.js App Router best practices, we separated interactive elements into dedicated Client Components while keeping the main page as a Server Component for SEO benefits.

### 1. Created WelcomeBannerButton.tsx (Client Component)
```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

const WelcomeBannerButton = () => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/#events";
  };

  return (
    <Button
      variant="secondary"
      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 py-2 rounded-full mt-4 md:mt-0"
      onClick={handleClick}
    >
      <Mic className="mr-2 h-4 w-4" />
      Find Events
    </Button>
  );
};
```

### 2. Created ProfileButtons.tsx (Reusable Client Component)
```typescript
"use client";

interface ProfileButtonsProps {
  type: "browse-events" | "edit-profile" | "view-details" | "create-event" | "no-tickets-browse" | "explore-events";
  eventId?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

const ProfileButtons = ({ type, eventId, className, variant = "default", size = "default" }: ProfileButtonsProps) => {
  const handleClick = () => {
    switch (type) {
      case "browse-events":
      case "explore-events":
      case "no-tickets-browse":
        window.location.href = "/#events";
        break;
      case "edit-profile":
        window.location.href = "/profile/edit";
        break;
      case "view-details":
        if (eventId) {
          window.location.href = `/events/${eventId}`;
        }
        break;
      case "create-event":
        window.location.href = "/events/create";
        break;
    }
  };
  // ... rest of component
};
```

### 3. Updated Profile Page Imports
```typescript
import WelcomeBannerButton from "@/components/toptemp/WelcomeBannerButton";
import ProfileButtons from "@/components/toptemp/ProfileButtons";
```

### 4. Replaced Server Component Buttons
**Before:**
```typescript
<Button
  variant="secondary"
  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 py-2 rounded-full mt-4 md:mt-0"
  onClick={(e) => {
    e.preventDefault();
    window.location.href = "/#events";
  }}
>
  <Mic className="mr-2 h-4 w-4" />
  Find Events
</Button>
```

**After:**
```typescript
<WelcomeBannerButton />
```

## Secondary Issue: Layout Width Constraints

### Problem
The profile page content was stretching edge-to-edge on larger screens, inconsistent with other pages.

### Solution: Wrapper Class Implementation
Replaced `container mx-auto px-4` with the existing `wrapper` class throughout all sections:

```css
.wrapper {
  @apply max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full;
}
```

**Sections Updated:**
- Welcome Banner section
- Profile Header section  
- Stats Section
- Preferences Section
- My Tickets Section

## Results & Benefits

### ✅ Error Resolution
- **Profile page loads successfully** (GET /profile 200)
- **No more "Event handlers cannot be passed to Client Component props" error**
- **All interactive buttons work properly**

### ✅ Architecture Benefits
- **Maintains SEO benefits** of Server Components for main page content
- **Enables interactivity** through separate Client Components
- **Follows Next.js App Router best practices**
- **Reusable component pattern** for future similar buttons

### ✅ Layout Consistency
- **Professional, consistent layout** that matches other pages
- **Responsive width constraints** prevent edge-to-edge content
- **Better user experience** on larger screens

## Key Learnings

### 1. Next.js App Router Rules
- **Server Components cannot have event handlers**
- **Use "use client" directive for interactive components**
- **Separate concerns**: Server Components for data/SEO, Client Components for interactivity

### 2. Component Architecture Pattern
- **Create dedicated Client Components** for interactive elements
- **Keep main pages as Server Components** when possible
- **Use reusable component patterns** for similar functionality

### 3. Layout Consistency
- **Use established wrapper classes** for consistent layouts
- **Follow existing patterns** in the codebase
- **Test across different screen sizes**

## Files Modified

### New Files Created
- `components/toptemp/WelcomeBannerButton.tsx`
- `components/toptemp/ProfileButtons.tsx`

### Files Modified
- `app/(root)/profile/page.tsx` - Replaced buttons and layout containers

## Future Recommendations

1. **Audit other pages** for similar Server Component + onClick handler issues
2. **Create component library** of common interactive elements
3. **Establish coding standards** for Server vs Client Component usage
4. **Document layout patterns** for consistent wrapper usage

## Related Components Reference

This solution builds upon existing Client Components in the codebase:
- `components/toptemp/CTAButton.tsx`
- `components/toptemp/AuthButtons.tsx`
- `components/toptemp/EditEventButton.tsx`
- `components/toptemp/CreateEventButton.tsx`

---

**Date:** 2025-08-12  
**Status:** ✅ Resolved  
**Impact:** Critical - Page was returning 500 errors  
**Solution Time:** ~2 hours  
**Testing:** Verified on localhost:3000/profile
