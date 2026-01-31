# Carousel & Location Block Relationship Architecture

## Overview

This document explains the one-to-one relationship between carousel location slides and location blocks, including type switching, cascading operations, and the complete workflow.

---

## Core Principles

### 1. **One-to-One Relationship**

- Each **locationPreview slide** ↔ One **location block**
- Required field: `locationBlockId` (cannot be optional)
- When slide deleted → location block should be deleted
- When location block deleted → carousel slide should be removed

### 2. **No Artificial Limits**

- Unlimited carousel slides allowed
- Unlimited location blocks allowed
- Relationship is 1:1, not constrained by arbitrary limits

### 3. **Type Consistency**

- All slides in a carousel must be the same type
- Either **all images** or **all location previews**
- Switching types converts all existing slides

---

## Schema Changes

### Before (Optional Relationship)

```text

locationBlockName: z.string().optional(); // Weak link by name
```

### After (Required 1-to-1)

```text

locationBlockId: z.string().min(1, "Location block ID is required"); // Strong link by ID
```

### Removed Limits

```text

// Before
.max(10, "Maximum 10 slides allowed")

// After
.min(1, "At least one slide is required")  // No max limit
```

---

## Type Switching Workflow

### Scenario 1: Empty Carousel → Select Type

**User Action:** First time opening dialog, no slides exist

**Workflow:**

1. Show auto-scroll and interval settings
2. Show type selection (Image / Location)
3. User clicks a type
4. Create one empty slide of that type
5. If locationPreview: Generate temp ID: `temp-{timestamp}-{random}`

**Result:** One empty slide ready for editing

---

### Scenario 2: Image Carousel → Location Carousel

**User Action:** Click "Location Carousel" when image slides exist

**Warning Dialog:**

```text
Converting to Location Carousel will:
- Create a new location block for each slide
- Use existing image and alt text
- Require you to fill in location details
```

**If Confirmed:**

1. For each image slide:
   ```typescript
   {
     type: "locationPreview",
     url: existingSlide.url,
     alt: existingSlide.alt,
     title: existingSlide.alt || "New Location",  // Default title
     description: "",
     locationBlockId: `temp-${Date.now()}-${Math.random()}`
   }
```
2. Update carouselType to "locationPreview"
3. User fills in location details
4. On save: Parent creates new location blocks for temp-\* IDs

---

### Scenario 3: Location Carousel → Image Carousel

**User Action:** Click "Image Carousel" when location slides exist

**Warning Dialog:**

```text
Converting to Image Carousel will:
- Keep existing images
- Remove all location block associations
- Delete orphaned location blocks
```

**If Confirmed:**

1. For each location slide:
   ```typescript
   {
     type: "image",
     url: existingSlide.url,
     alt: existingSlide.alt
   }
```
2. Store old locationBlockIds for cleanup
3. Update carouselType to "image"
4. On save: Parent deletes orphaned location blocks

---

## Add/Delete Operations

### Add Slide (In Between)

**Button Location:** Every slide card has a `+` button

**User Action:** Click `+` on Slide 2

**Workflow:**

```json

// Insert after index
handleAddUnit(afterIndex: 2)

// New slide inserted at index 3
slideUnits.splice(3, 0, {
  type: carouselType,
  url: "",
  alt: "",
  locationBlockId: carouselType === "locationPreview"
    ? `temp-${Date.now()}-${Math.random()}`
    : undefined
})
```

**Result:** New slide inserted after Slide 2, becomes new Slide 3

---

### Delete Slide (Not First)

**Button Location:** All slides except first have trash icon

**User Action:** Click trash on Slide 3

**Workflow for Image Slide:**

```typescript

// Simply remove from array
slideUnits = slideUnits.filter((_, i) => i !== 3);
```

**Workflow for Location Slide:**

```typescript

const locationBlockId = slideUnits[3].locationBlockId;

// Remove from array
slideUnits = slideUnits.filter((_, i) => i !== 3);

// On save:
if (!locationBlockId.startsWith("temp-")) {
  // Real location block - mark for cascading delete
  blocksToDelete.push(locationBlockId);
}
```

**Protection:** First slide cannot be deleted (ensures minimum one slide)

---

## Save Operation

### Parent Component Responsibilities

When carousel dialog saves, the parent page editor must:

#### 1. **Create New Location Blocks**

```typescript

const newLocationBlocks = [];
const idMapping = new Map(); // temp-id → real-id

for (const slide of carouselSlides) {
  if (
    slide.type === "locationPreview" &&
    slide.locationBlockId.startsWith("temp-")
  ) {
    // Create new location block
    const newBlock = {
      id: generateId(),
      type: "location",
      order: getNextOrder(),
      content: {
        name: slide.title,
        address: "",
        phone: "",
        description: slide.description,
        images: [{ url: slide.url, alt: slide.alt }],
        schedule: [],
      },
    };

    newLocationBlocks.push(newBlock);
    idMapping.set(slide.locationBlockId, newBlock.id);
  }
}

// Update carousel slides with real IDs
carouselSlides = carouselSlides.map((slide) => {
  if (slide.type === "locationPreview") {
    return {
      ...slide,
      locationBlockId:
        idMapping.get(slide.locationBlockId) || slide.locationBlockId,
    };
  }
  return slide;
});
```

#### 2. **Delete Orphaned Location Blocks**

```typescript

// Get all location block IDs currently in carousel
const activeLocationIds = new Set(
  carouselSlides
    .filter((s) => s.type === "locationPreview")
    .map((s) => s.locationBlockId)
);

// Find location blocks that were linked but are no longer
const orphanedBlocks = existingLocationBlocks.filter(
  (block) => !activeLocationIds.has(block.id)
);

// Mark for deletion
orphanedBlocks.forEach((block) => {
  block.isDeleted = true;
});
```

#### 3. **Update Location Block Content**

```typescript

// When slide title/description changes, update location block
for (const slide of carouselSlides) {
  if (slide.type === "locationPreview") {
    const locationBlock = blocks.find((b) => b.id === slide.locationBlockId);
    if (locationBlock) {
      locationBlock.content.name = slide.title;
      // Optionally sync description to location block
    }
  }
}
```

---

## UI Indicators

### Slide Header Labels

```text
Slide 1 (New Location Block)         // temp-* ID
Slide 2 (Linked to Location Block)   // Real ID
```

### Location Block Info Box

Shows in each locationPreview slide:

**For New Blocks (temp-\*):**

```text
Location Block: A new location block will be created
when you save this carousel.
```

**For Existing Blocks:**

```text
Location Block: This slide is linked to an existing
location block. Edit location details in the location
block itself.
```

---

## Button Placement

### Add Button `+`

- **Location:** Every slide card (top right)
- **Function:** Adds slide AFTER current slide
- **Always shown:** No limits, add unlimited slides

### Delete Button `🗑️`

- **Location:** Every slide EXCEPT first (top right)
- **Function:** Removes slide (and marks location block for deletion)
- **Protection:** First slide cannot be deleted

### Move Up/Down `↑ ↓`

- **Location:** Every slide (top right)
- **Function:** Reorder slides in stack
- **Disabled:** Up on first, Down on last

---

## Edge Cases & Validation

### Case 1: Save Without Required Fields

**Validation:**

```text

// For all slides
if (!unit.url && !unit.pendingFile) error = "Image required";
if (!unit.alt.trim()) error = "Alt text required";

// For locationPreview only
if (!unit.title?.trim()) error = "Title required";
if (!unit.description?.trim()) error = "Description required";
if (!unit.locationBlockId) error = "Location block ID required";
```

**Result:** Show inline errors, prevent save

### Case 2: Delete All But First Slide

**Scenario:** User tries to delete last remaining slide

**Protection:** Delete button not shown on first slide when only one exists

### Case 3: Switch Type Multiple Times

**Scenario:** Image → Location → Image → Location

**Workflow:**

1. Each switch shows warning dialog
2. Each confirmation converts slides
3. Location blocks created on save (not during dialog)
4. Orphaned blocks cleaned up on save

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     CAROUSEL DIALOG                         │
│                                                             │
│  Auto-scroll: [✓]  Interval: 5s                           │
│                                                             │
│  Type: [Image] [Location] ← Always visible                │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Slide 1 (New Location Block)    [↓] [+] [🗑️]    │    │
│  │  ┌────────┐  Title: Downtown Roastery             │    │
│  │  │ IMAGE  │  Desc:  Best coffee in SF              │    │
│  │  └────────┘  Info: New block will be created      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Slide 2 (Linked...)           [↑] [↓] [+] [🗑️]   │    │
│  │  ┌────────┐  Title: Boulder Location              │    │
│  │  │ IMAGE  │  Desc:  Mountain vibes                 │    │
│  │  └────────┘  Info: Linked to existing block       │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│                         [Cancel]  [Save]                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Save clicked
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PARENT PAGE EDITOR                        │
│                                                             │
│  1. Create new location blocks for temp-* IDs              │
│  2. Update carousel slides with real IDs                   │
│  3. Delete orphaned location blocks                        │
│  4. Save all blocks to database                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Carousel Dialog (✅ Complete)

- [✅] Type selection always visible
- [✅] Type switching with warning dialog
- [✅] Slide conversion logic (image ↔ location)
- [✅] Add button on every slide
- [✅] Delete button (not on first slide)
- [✅] Temp ID generation for new location blocks
- [✅] Validation for all required fields
- [✅] Preview URLs for pending images
- [✅] Batch upload on save

### Parent Component (⚠️ TODO)

- [ ] Create location blocks for temp-\* IDs on save
- [ ] Map temp IDs to real IDs
- [ ] Update carousel with real location block IDs
- [ ] Detect orphaned location blocks
- [ ] Mark orphaned blocks as deleted
- [ ] Sync slide title → location block name
- [ ] Handle cascading delete (location block → carousel slide)

### Location Block Component (⚠️ TODO)

- [ ] Add `data-location-id` attribute for linking
- [ ] Add `data-location-name` attribute for display
- [ ] Show warning if linked to carousel slide
- [ ] Prevent delete if linked (or show impact warning)

### Schema Updates (✅ Complete)

- [✅] Change `locationBlockName` → `locationBlockId`
- [✅] Make `locationBlockId` required (not optional)
- [✅] Remove max slides limit

---

## Testing Scenarios

### Test 1: New Location Carousel

1. Open empty carousel
2. Select "Location Carousel"
3. Add 3 slides
4. Fill in all fields
5. Save
6. **Expected:** 3 new location blocks created, carousel saved

### Test 2: Convert Image → Location

1. Create image carousel with 2 slides
2. Save
3. Reopen dialog
4. Click "Location Carousel"
5. Confirm conversion
6. Fill in location details
7. Save
8. **Expected:** 2 new location blocks created, images preserved

### Test 3: Convert Location → Image

1. Create location carousel with 2 slides
2. Save (creates 2 location blocks)
3. Reopen dialog
4. Click "Image Carousel"
5. Confirm conversion
6. Save
7. **Expected:** 2 location blocks deleted, images kept

### Test 4: Add Slide In Between

1. Open carousel with 3 slides
2. Click `+` on Slide 2
3. Fill in new slide
4. Save
5. **Expected:** New slide inserted after Slide 2, becomes Slide 3

### Test 5: Delete Middle Slide

1. Open carousel with 3 location slides
2. Click trash on Slide 2
3. Save
4. **Expected:** Slide 2 removed, location block deleted, Slide 3 becomes Slide 2

### Test 6: Reorder Slides

1. Open carousel with 3 slides
2. Click ↓ on Slide 1
3. Save
4. **Expected:** Slide 1 becomes Slide 2, order updated

---

## Future Enhancements

### Bi-directional Sync

- Edit location block → update carousel slide
- Edit carousel slide → update location block
- Show sync status indicators

### Bulk Operations

- "Add 5 locations" button
- Import from CSV
- Duplicate slide with location block

### Advanced Linking

- Link multiple carousels to same location blocks
- Show "Used in X carousels" badge
- Warning before deleting shared location block

### Preview Mode

- Live carousel preview in dialog
- Test auto-scroll timing
- View on mobile/desktop breakpoints
