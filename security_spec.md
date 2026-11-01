# Security Specification & Threat Model

## Data Invariants
1. All documents under `/users/{userId}/...` belong strictly to the authenticated user with `request.auth.uid == userId`.
2. Unauthenticated access is completely rejected.
3. Users cannot read or write to any other user's dashboard data.

## Dirty Dozen Security Test Cases
1. Unauthenticated write to `/users/user123/data/financial_dashboard` -> DENIED
2. Authenticated user A writing to `/users/userB/data/financial_dashboard` -> DENIED
3. User A attempting to read `/users/userB/data/financial_dashboard` -> DENIED
4. User A setting `userId` to `userB` in body -> DENIED
5. Unauthenticated read of user document -> DENIED
6. Non-existent path write attempt `/{document=**}` -> DENIED
7. User updating document with invalid ID path variable -> DENIED
8. Spoofed auth token or unverified email -> DENIED
9. Injection of unexpected fields outside schema -> DENIED
10. Attempting to list all users -> DENIED
11. Attempting to override `userId` on update -> DENIED
12. Attempting to tamper with system or other users' collections -> DENIED
