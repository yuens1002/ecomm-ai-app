# v{X.X.X} - {Feature Name}

**Release Date**: YYYY-MM-DD  
**Commit**: {commit-hash}  
**Branch**: feature/{branch-name}

---

## Overview

Brief description of what this release accomplishes and why it was needed.

---

## User-Facing Changes

What users/employers will see:

- Feature 1
- Feature 2
- Feature 3

---

## Technical Implementation

### Database Changes

**Migration**: `{migration-name}`

**Schema Changes**:

```prisma
model NewModel {
  id        String   @id @default(cuid())
  field1    String
  field2    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([field1])
}
```

**Reasoning**: Why these fields? What problem do they solve?

---

### API Endpoints

#### Admin Endpoints (Authentication Required)

**GET `/api/admin/resource`**

- Purpose: Description
- Auth: Admin only
- Returns: Data structure

**POST `/api/admin/resource`**

- Purpose: Description
- Body: `{ field1: string, field2: boolean }`
- Returns: Created resource

**PATCH `/api/admin/resource/[id]`**

- Purpose: Description
- Body: Partial update object
- Returns: Updated resource

**DELETE `/api/admin/resource/[id]`**

- Purpose: Description
- Returns: Success confirmation

#### Public Endpoints

**GET `/api/resource`**

- Purpose: Description
- Returns: Public data

**POST `/api/action`**

- Purpose: Description
- Validation: Zod schema
- Returns: Result

---

### Components & Files

#### Server Components

- `path/to/Component.tsx` - Description

#### Client Components

- `path/to/ClientComponent.tsx` - Description
- `path/to/AnotherClient.tsx` - Description

#### API Routes

- `app/api/route/route.ts` - Description

---

### Authentication & Authorization

How authentication is implemented:

- NextAuth v5 `auth()` function
- Admin role checking
- Session validation

---

### Design Decisions

**Decision 1**: What we chose and why

- Alternative considered
- Tradeoffs
- Reasoning

**Decision 2**: Another important choice

- Context
- Rationale

---

### Configuration

**Environment Variables**:

```
VARIABLE_NAME=value
ANOTHER_VAR=value
```

**Admin Credentials** (if applicable):

- Email: admin@domain.com
- Password: {stored-securely}
- Reset script: `dev-tools/reset-password.ts`

---

### Dependencies Added/Updated

- `package-name@version` - Purpose
- `another-package@version` - Purpose

---

### Testing Notes

**Manual Testing**:

- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

**Edge Cases**:

- Scenario 1 - Expected behavior
- Scenario 2 - Expected behavior

---

### Known Issues / Future Enhancements

**Known Issues**:

- Issue 1 - Workaround

**Future Enhancements**:

- Enhancement 1
- Enhancement 2

---

### Migration Path

For existing databases:

1. Run migration: `npx prisma migrate dev`
2. Generate client: `npx prisma generate`
3. Optional: Seed data script

---

### Code Quality

**Linting**: Passed  
**Type Checking**: Passed  
**Build**: Successful

---

## Resources

- Related PRs: #123
- Related Issues: #456
- Design mockups: [link]
- External documentation: [link]

---

_This document is for internal reference only and should not be included in public repositories._
