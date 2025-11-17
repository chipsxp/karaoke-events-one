# Karaoke Events Admin Hierarchy Implementation Journal

## Overview
This document outlines the step-by-step implementation plan and code changes required to establish a hierarchical admin structure for role verification in the Karaoke Events platform. The goal is to ensure:
- **Promoter (Admin)** verifies KJs
- **KJ** verifies KS (Singers)
- **KS** must be verified by a KJ

## Problem Statement
Currently, any user can select any role (KJ, KS, Promoter) without verification, leading to potential misuse and lack of command order.

## Solution Summary
Introduce a chain of command:
- Promoter (Admin) → KJ (Verified by Promoter) → KS (Verified by KJ)
- Add verification status and references in the user model
- Update dashboards and flows to support verification requests and approvals

---

## Step-by-Step Implementation Plan

### 1. Update User Types
- **File:** `types/index.ts`
- Add `isAdmin`, `isVerified`, `verifiedBy`, and `pendingVerification` fields to user type.
- Define role constants and admin logic.

### 2. Update User Model (MongoDB)
- **File:** `lib/database/models/user.model.ts`
- Add fields:
  - `role: 'KS' | 'KJ' | 'Promoter'`
  - `isVerified: boolean`
  - `verifiedBy: ObjectId` (ref to Promoter or KJ)
  - `pendingVerification: boolean`
  - `verificationRequests: [{ type, requestedBy, status }]`

### 3. Update User Actions
- **File:** `lib/actions/user.actions.ts`
- Add functions:
  - `requestVerification(userId, role)`
  - `approveVerification(requestId, approverId)`
  - `getPendingVerifications(role)`
  - Update `createUser` to set `pendingVerification` for KJ and KS

### 4. Update Sign-Up and Role Selection Flow
- **Files:**
  - `app/(auth)/sign-up/[[...sign-up]]/`
  - `app/(root)/role-selection/page.tsx`
- On sign-up, KS and KJ accounts are created as `pendingVerification: true`
- Add UI for requesting verification

### 5. Update Dashboards
- **Files:**
  - `components/dashboard/PromoterDashboard.tsx`: List pending KJ requests, approve/deny
  - `components/dashboard/KJDashboard.tsx`: List pending KS requests, approve/deny
  - `components/dashboard/KSDashboard.tsx`: Show verification status

### 6. Update Dashboard Routing Logic
- **File:** `app/(root)/dashboard/page.tsx`
- Redirect unverified users to a waiting page or show limited dashboard
- Only verified users get full access

### 7. Update MongoDB Data
- Ensure user documents reflect verification status and chain of command

---

## Example MongoDB User Document
```json
{
  "_id": "userId",
  "role": "KJ",
  "isVerified": true,
  "verifiedBy": "promoterId",
  "pendingVerification": false,
  "verificationRequests": []
}
```

---

## Checklist
- [ ] Update types/index.ts
- [ ] Update user.model.ts
- [ ] Update user.actions.ts
- [ ] Update sign-up and role selection flows
- [ ] Update PromoterDashboard for KJ approvals
- [ ] Update KJDashboard for KS approvals
- [ ] Update KSDashboard for verification status
- [ ] Update dashboard/page.tsx for routing logic
- [ ] Test MongoDB data structure

---

## Code Flow Chart
```mermaid
graph TD
    A[User Signs Up] --> B[Selects Role]
    B -->|KS| C[KS Account Created (Pending)]
    B -->|KJ| D[KJ Account Created (Pending)]
    B -->|Promoter| E[Promoter Account Created (Admin)]
    D --> F[Promoter Reviews & Verifies KJ]
    C --> G[KJ Reviews & Verifies KS]
    E --> H[PromoterDashboard: Approve KJ]
    F --> I[KJDashboard: Approve KS]
    C -->|Unverified| J[Limited Access]
    D -->|Unverified| J
    G -->|Verified| K[Full Access]
    F -->|Verified| K
```

---

## Notes
- This structure ensures only authorized users can access higher privileges.
- Verification requests and approvals are tracked in the database.
- UI should clearly indicate verification status and provide actions for approvers.

---

## Next Steps
Follow the checklist above to implement and test each step. Update this journal as progress is made.
