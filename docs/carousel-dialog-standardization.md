# Carousel Dialog Standardization - Implementation Summary

## Overview

Refactored the carousel block edit dialog to follow a standardized pattern and improve UX based on requirements:

1. **Standardized dialog shell** for reuse across all block types
2. **Type-first selection** - user chooses carousel type before seeing slides
3. **Unit-based slide management** - each slide is a complete unit with all required fields
4. **Two-column layout** - image left (40%), fields right (60%)
5. **Pending uploads** - images upload only when user clicks Save
6. **Add/delete/reorder controls** per slide unit
7. **Always show at least one unit** (requirement for carousel)

## New Components

### 1. BlockEditDialog Component

**Location:** `components/ui/BlockEditDialog.tsx`

**Purpose:** Standardized dialog shell for all block editing

**Features:**

- Consistent title, description, close button
- Scrollable content area
- Fixed action buttons at bottom (Cancel/Save)
- Loading states during save
- Configurable button labels

**Props:**

```typescript

interface BlockEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
}
```

**Usage Pattern:**

```tsx

<BlockEditDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit Block Name"
  description="Optional description text"
  onSave={handleSave}
  onCancel={handleCancel}
  isSaving={isSaving}
>
  {/* Block-specific form content */}
</BlockEditDialog>
```

### 2. PendingImageUpload Component

**Location:** `components/ui/PendingImageUpload.tsx`

**Purpose:** Image upload component that doesn't upload until parent saves

**Features:**

- File selection with preview
- Preview URL from File object (local, no upload)
- Remove button to clear selection
- Validation (file type, size limits)
- Aspect ratio support (square, video, 4/3, 16/9)
- Shows existing URL if no pending file

**Props:**

```typescript

interface PendingImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  currentFile?: File;
  onRemove?: () => void;
  aspectRatio?: "square" | "video" | "4/3" | "16/9";
  maxSizeMB?: number;
}
```

**Key Difference from ImageUpload:**

- **ImageUpload**: Uploads immediately to /api/upload
- **PendingImageUpload**: Creates preview URL, uploads on parent save

## Refactored Carousel Dialog

### User Flow

1. **Type Selection (First)**
   - User sees two options: "Image Carousel" or "Location Carousel"
   - Click to select type
   - All slides must be same type (enforced)

2. **Carousel Settings**
   - Auto-scroll toggle
   - Interval slider (2-10 seconds)
   - Shown after type selection

3. **Slide Units**
   - Shows count: "Slides (3)"
   - "Add Slide" button to add more
   - Each unit is a card with:
     - Slide number header
     - Up/down arrows to reorder
     - Delete button (disabled if only one slide)
     - Two-column layout

4. **Slide Unit Layout (5-column grid)**
   - **Left (2 columns)**: Image upload area
     - PendingImageUpload component
     - Preview of selected file or existing URL
     - Remove button to clear
   - **Right (3 columns)**: Form fields
     - Alt text (required, all types)
     - Title (required, location only)
     - Description (required, location only)
     - Link to location block (optional, location only)

5. **Save Action**
   - Validates all slides (required fields)
   - Shows inline errors with red borders and error text
   - Uploads all pending images to /api/upload
   - Updates block content
   - Cleans up preview URLs
   - Closes dialog

6. **Cancel Action**
   - Cleans up all preview URLs
   - Resets state
   - Closes dialog without saving

### Data Structure

**SlideUnit Type:**

```json

type SlideUnit = {
  type: "image" | "locationPreview";
  url: string; // Existing URL from DB
  alt: string;
  title?: string; // Location only
  description?: string; // Location only
  locationBlockName?: string; // Location only
  pendingFile?: File; // New file selected (not uploaded yet)
  previewUrl?: string; // Blob URL for preview
};
```

### Key State Management

```typescript

const [carouselType, setCarouselType] = useState<
  "image" | "locationPreview" | null
>(null);
const [slideUnits, setSlideUnits] = useState<SlideUnit[]>([]);
const [autoScroll, setAutoScroll] = useState(true);
const [intervalSeconds, setIntervalSeconds] = useState(5);
const [isSaving, setIsSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

### Validation

**Error Keys:**

- `${index}-image`: Missing image/file
- `${index}-alt`: Missing alt text
- `${index}-title`: Missing title (location only)
- `${index}-description`: Missing description (location only)

**Validation Logic:**

```typescript

const validateSlides = (): boolean => {
  slideUnits.forEach((unit, index) => {
    if (!unit.url && !unit.pendingFile) {
      newErrors[`${index}-image`] = "Image is required";
    }
    if (!unit.alt.trim()) {
      newErrors[`${index}-alt`] = "Alt text is required";
    }
    if (unit.type === "locationPreview") {
      if (!unit.title?.trim()) {
        newErrors[`${index}-title`] = "Title is required";
      }
      if (!unit.description?.trim()) {
        newErrors[`${index}-description`] = "Description is required";
      }
    }
  });
  return Object.keys(newErrors).length === 0;
};
```

### Upload on Save

```typescript

const handleSave = async () => {
  if (!validateSlides()) return;

  setIsSaving(true);

  try {
    // Upload all pending images
    const slidesWithUrls = await Promise.all(
      slideUnits.map(async (unit) => {
        let imageUrl = unit.url;

        if (unit.pendingFile) {
          imageUrl = await uploadImage(unit.pendingFile);
        }

        if (unit.previewUrl) {
          URL.revokeObjectURL(unit.previewUrl);
        }

        return {
          type: unit.type,
          url: imageUrl,
          alt: unit.alt,
          ...(unit.type === "locationPreview" && {
            title: unit.title!,
            description: unit.description!,
            locationBlockName: unit.locationBlockName,
          }),
        };
      })
    );

    onUpdate({
      ...block,
      content: { slides: slidesWithUrls, autoScroll, intervalSeconds },
    });

    setOpen(false);
  } catch (error) {
    alert("Failed to save carousel. Please try again.");
  } finally {
    setIsSaving(false);
  }
};
```

## Benefits

### User Experience

1. **Clear workflow**: Type selection → Add slides → Configure → Save
2. **Visual feedback**: Preview images before upload
3. **Validation**: Inline error messages with red borders
4. **Flexibility**: Reorder slides with up/down buttons
5. **Safety**: Must keep at least one slide
6. **No accidental uploads**: Images only upload when user clicks Save

### Developer Experience

1. **Reusable components**: BlockEditDialog for other blocks
2. **Type safety**: TypeScript with proper discriminated unions
3. **Clean separation**: Upload logic separate from preview logic
4. **Easy maintenance**: Validation and upload in clear functions
5. **Consistent patterns**: Follows HeroBlock standards

### Performance

1. **Batch uploads**: All images uploaded together on save
2. **Preview URLs**: Local blob URLs, no server calls for preview
3. **Cleanup**: Preview URLs properly revoked to prevent memory leaks
4. **Parallel uploads**: Promise.all for concurrent uploads

## Next Steps

### Apply to Other Blocks

**HeroBlock** - Can use:

- `BlockEditDialog` wrapper
- `PendingImageUpload` (already has pending pattern)

**LocationBlock** - Can use:

- `BlockEditDialog` wrapper
- `PendingImageUpload` for multiple images

**Future Blocks** - Always use:

- `BlockEditDialog` for consistent shell
- `PendingImageUpload` for image fields
- Same validation and error display patterns

### Example Migration (HeroBlock)

```tsx

// Before: Custom dialog with inline structure
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>...</DialogHeader>
    <div className="space-y-4">...</div>
    <div className="flex justify-end gap-2">
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </div>
  </DialogContent>
</Dialog>

// After: Using BlockEditDialog
<BlockEditDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  title="Edit Hero"
  description="Update the hero banner image, title, and caption"
  onSave={handleSave}
  onCancel={handleCancel}
  isSaving={isSaving}
>
  {/* Just the fields, no structure boilerplate */}
  <FieldGroup>
    <Field>...</Field>
    <Field>...</Field>
  </FieldGroup>
</BlockEditDialog>
```

## Testing Checklist

- [ ] Type selection shows before slides
- [ ] Can't proceed without selecting type
- [ ] Initial unit appears after type selection
- [ ] Add slide button creates new unit
- [ ] Delete button disabled when only one unit
- [ ] Up/down arrows reorder correctly
- [ ] Up disabled on first slide
- [ ] Down disabled on last slide
- [ ] Image upload shows preview immediately
- [ ] Remove button clears preview
- [ ] Validation shows errors on save attempt
- [ ] Red borders appear on invalid fields
- [ ] Can't save with validation errors
- [ ] Images upload on save (check /api/upload calls)
- [ ] Preview URLs cleaned up on save/cancel
- [ ] Existing slides load correctly on dialog open
- [ ] Location dropdown shows available locations
- [ ] Auto-scroll settings persist
- [ ] Carousel displays correctly after save
