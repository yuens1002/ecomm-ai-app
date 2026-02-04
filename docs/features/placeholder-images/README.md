# Placeholder Images

Curated Unsplash images for products without uploaded images.

## How It Works

- Images are assigned at **runtime** based on product name
- No database storage - lookup tables in `lib/placeholder-images.ts`
- Each product gets a unique, hand-curated image

## Image Categories

| Category | Used For | Source |
|----------|----------|--------|
| `beans` | Coffee products | Raw coffee bean photos |
| `culture` | Merch products | Coffee cups, equipment, lifestyle |
| `cafe` | CMS pages (About, FAQ, Cafe) | Cafe interiors |

## Updating Production

**No database changes required.** Placeholder images are generated from code, not stored in the database.

To update production:

1. Merge changes to `main`
2. Vercel auto-deploys
3. New images appear immediately

## Adding/Changing Images

### Finding Unsplash Photos

1. Browse [Unsplash](https://unsplash.com) for photos
2. **Avoid Unsplash+ (premium)** photos - they use a different CDN
3. Copy the photo slug from the URL (e.g., `9GnJ6YnkHp4` from `/photos/brown-coffee-beans-9GnJ6YnkHp4`)

### Getting the Photo ID

Use the Unsplash API to convert slug to photo ID:

```bash
curl -s "https://api.unsplash.com/photos/SLUG" \
  -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" \
  | grep -o '"raw":"[^"]*"' | head -1
```

Extract the `photo-XXXXX` portion from the raw URL.

### Verifying the Photo ID

```bash
curl -sI "https://images.unsplash.com/photo-XXXXX?w=50" | head -1
# Should return: HTTP/1.1 200 OK
```

If you get 404, the photo may be:

- Premium (Unsplash+) - use a different photo
- Invalid ID - re-check the conversion

### Updating the Lookup Table

Edit `lib/placeholder-images.ts`:

```typescript
const COFFEE_PRODUCT_IMAGES: Record<string, string> = {
  "Product Name": "photo-XXXXX-XXXXX",  // slug
  // ...
};
```

## URL Format

```
https://images.unsplash.com/{photo-id}?w={width}&h={height}&fit=crop&crop=entropy
```

## Unsplash+ (Premium) Photos

Premium photos use a different domain and won't work with our URL pattern:

- Regular: `https://images.unsplash.com/photo-XXXXX`
- Premium: `https://plus.unsplash.com/premium_photo-XXXXX`

**Always use free photos** to avoid CDN issues.

## Files

| File | Purpose |
|------|---------|
| `lib/placeholder-images.ts` | Lookup tables and URL generation |
| `.env.local` | `UNSPLASH_ACCESS_KEY` for API access |
