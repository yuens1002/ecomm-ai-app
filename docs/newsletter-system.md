# Newsletter System Documentation

## Overview

The newsletter system provides email collection, welcome emails, subscriber management, and unsubscribe functionality. All email communications use a configurable contact email from the Settings model.

## Architecture

### Database Models

**NewsletterSubscriber**

```json

model NewsletterSubscriber {
  id                String   @id @default(cuid())
  email             String   @unique
  subscribedAt      DateTime @default(now())
  isActive          Boolean  @default(true)
  unsubscribeToken  String   @unique @default(cuid())
}
```

**SiteSettings**

```json

model SiteSettings {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

### Key Setting

- `contactEmail`: Email address used as sender for all system communications (newsletter, orders, contact form)
- Default: `onboarding@resend.dev` (for development/testing)
- Production: Should be updated to verified domain email

## Features

### 1. Newsletter Signup

**Endpoint**: `POST /api/newsletter`

**Flow**:

1. User submits email via newsletter form (footer, dedicated page, etc.)
2. System validates email format
3. Checks for existing subscription:
   - If already active: Returns "already subscribed" message
   - If inactive: Reactivates subscription and sends welcome email
   - If new: Creates subscription and sends welcome email
4. Generates unique unsubscribe token
5. Sends welcome email with unsubscribe link

**Email Template**: `NewsletterWelcomeEmail.tsx`

- Subject: "Welcome to Artisan Roast Newsletter! ☕"
- Includes: Welcome message, subscription benefits, unsubscribe link
- Uses contactEmail from Settings as sender

### 2. Welcome Email

**Trigger**: Successful newsletter signup (new or reactivation)

**Content**:

- Welcome message and thank you
- List of subscriber benefits (new arrivals, discounts, brewing tips, stories)
- Confirmation of subscribed email address
- Unsubscribe link in footer

**Sender**: Configured via `contactEmail` in SiteSettings

- Format: `Artisan Roast <{contactEmail}>`
- Fetched dynamically from database on each send

### 3. Unsubscribe Functionality

**Endpoint**: `POST /api/newsletter/unsubscribe`

**Public Page**: `/newsletter/unsubscribe?token={token}`

**Flow**:

1. User clicks unsubscribe link in email
2. Redirected to unsubscribe page with token in URL
3. Page automatically calls API with token
4. System validates token and marks subscriber as inactive
5. Displays success/error message
6. Provides link to return to homepage

**Data Handling**:

- Subscribers are marked `isActive: false` (soft delete)
- Records are never deleted (for analytics and compliance)
- Resubscription possible (reactivates existing record)

### 4. Admin Management

**Location**: Admin Dashboard → Newsletter Tab

**Features**:

- **Stats Cards**:
  - Total Subscribers (all time signups)
  - Active Subscribers (currently subscribed, percentage)
  - Unsubscribed (churned subscribers, percentage)
- **Subscriber List**:
  - View all subscribers with email, subscription date, status
  - Search by email
  - Filter (future enhancement)
  - Export to CSV
- **Export CSV**:
  - Downloads CSV with: Email, Subscribed At, Status
  - Filename: `newsletter-subscribers-YYYY-MM-DD.csv`
  - Respects current search filter

**API Endpoint**: `GET /api/admin/newsletter`

- Returns subscribers array and stats object
- Requires admin authentication

## Email Configuration

### Admin Settings Panel

**Location**: Admin Dashboard → Settings Tab → Email Configuration

**Fields**:

- **Contact Email**: Single email used for all communications
  - Used for: Newsletter, order confirmations, contact form responses
  - Validated: Must be valid email format
  - Default: `onboarding@resend.dev`

**Why Single Email?**

- Simplifies configuration and management
- Ensures consistent sender identity
- Reduces configuration overhead
- Can be expanded to multiple emails if needed (see backlog)

### Changing Email Address

1. Navigate to Admin Dashboard → Settings
2. Edit Contact Email field
3. Click Save
4. Email updates immediately for all future communications
5. Recommended: Use verified domain email in production

## Testing

### End-to-End Flow

1. **Signup**:
   - Subscribe via newsletter form
   - Verify welcome email received
   - Check unsubscribe link in email

2. **Admin View**:
   - Check subscriber appears in admin list
   - Verify stats updated (Total, Active)
   - Test search functionality
   - Export CSV and verify data

3. **Unsubscribe**:
   - Click unsubscribe link from email
   - Verify success page displayed
   - Check subscriber marked inactive in admin
   - Verify stats updated (Active count decreased, Inactive count increased)

4. **Resubscribe**:
   - Subscribe again with same email
   - Verify welcome email sent
   - Check subscriber reactivated in admin
   - Verify stats updated correctly

### Email Settings Test

1. Change contactEmail in Settings
2. Trigger newsletter signup
3. Verify welcome email sent from new address
4. Test order confirmation uses same email
5. Test contact form uses same email

## Production Checklist

- [ ] Update contactEmail to verified domain email (not resend.dev)
- [ ] Configure Resend API key in production environment
- [ ] Verify domain in Resend dashboard
- [ ] Test welcome emails deliver successfully
- [ ] Test unsubscribe flow works correctly
- [ ] Verify admin dashboard accessible and functional
- [ ] Configure SPF/DKIM records for sending domain
- [ ] Test CSV export functionality
- [ ] Review email templates for branding consistency

## Future Enhancements

### Backlog Items

1. **Store Name Configuration** (Low Priority)
   - Add storeName to Settings model
   - Update email templates to use dynamic store name
   - Currently hardcoded as "Artisan Roast"

2. **Multiple Email Types** (Future Consideration)
   - Separate emails for: newsletter, orders, support
   - More granular control
   - Different sender identities per email type

3. **Email Campaigns** (Future)
   - Compose and send bulk emails to active subscribers
   - Template management
   - Campaign analytics

4. **Segmentation** (Future)
   - Tag subscribers by interest
   - Targeted campaigns
   - Purchase behavior tracking

## Troubleshooting

### Welcome Email Not Sending

1. Check Resend API key configured correctly
2. Verify contactEmail is valid format
3. Check Resend dashboard for delivery errors
4. Verify domain verified in Resend (if using custom domain)
5. Check server logs for API errors

### Unsubscribe Link Not Working

1. Verify unsubscribeToken exists in database
2. Check URL format: `/newsletter/unsubscribe?token={token}`
3. Verify API endpoint accessible
4. Check token hasn't been modified/truncated in email

### Admin View Not Loading

1. Verify admin authentication
2. Check API endpoint returns data
3. Look for console errors in browser
4. Verify database connection

### CSV Export Empty

1. Check search filter (may be filtering out all results)
2. Verify subscribers exist in database
3. Check browser console for JavaScript errors

## API Reference

### Public Endpoints

**POST /api/newsletter**

- Subscribe to newsletter
- Body: `{ email: string }`
- Returns: Success message or error

**POST /api/newsletter/unsubscribe**

- Unsubscribe from newsletter
- Body: `{ token: string }`
- Returns: Success message or error

### Admin Endpoints

**GET /api/admin/newsletter**

- Fetch all subscribers with stats
- Auth: Admin only
- Returns: `{ subscribers: [], stats: { total, active, inactive } }`

**GET /api/admin/settings/email**

- Fetch email configuration
- Auth: Admin only
- Returns: `{ contactEmail: string }`

**PUT /api/admin/settings/email**

- Update email configuration
- Auth: Admin only
- Body: `{ contactEmail: string }`
- Returns: Success message or error

## Compliance Notes

### Data Retention

- Unsubscribed users marked inactive, not deleted
- Maintains historical records for analytics
- Complies with audit requirements

### Unsubscribe Requirements

- One-click unsubscribe link in every email
- No login required to unsubscribe
- Immediate processing (no delays)
- Confirmation message displayed

### Privacy Considerations

- Only email address collected (minimal data)
- No additional tracking without consent
- Secure token-based unsubscribe (no email exposure)
- Data accessible only to admins

---

**Last Updated**: November 24, 2025  
**Version**: 0.24.0
