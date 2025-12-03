# CMS Blocks Architecture

## Overview

The CMS block system provides a structured, type-safe way to build page content. Each page type has a predefined layout with specific block types, and all blocks ship with sensible defaults - users edit existing content rather than building from scratch.

## Core Principles

### 1. No Empty States

**Pages are pre-populated with all required blocks and default content.**

- Users edit existing content, not build from scratch
- All required fields have default values
- Minimum counts are enforced (e.g., at least 1 image)
- Delete is disabled when at minimum count

This approach is intentional because:

- Reduces cognitive load for store owners
- Ensures consistent page structure
- Prevents invalid/broken page states
- Simplifies validation

### 2. Schema-Driven Validation

All block content is validated by **Zod schemas** (`lib/blocks/schemas.ts`):

```typescript
// Example: LocationBlock schema
export const locationBlockSchema = baseBlockSchema.extend({
  type: z.literal("location"),
  content: z.object({
    name: z.string().min(1, "Location name is required").max(100),
    address: z.string().min(1, "Address is required").max(500),
    images: z
      .array(
        z.object({
          url: z.string().min(1, "Image URL is required"),
          alt: z.string().min(1, "Alt text is required").max(125),
        })
      )
      .min(1, "At least one image is required"),
    // ...
  }),
});
```

**Schema defines:**

- Required vs optional fields (`.min(1)` vs `.optional()`)
- Minimum/maximum array lengths (`.min(1)`, `.max(12)`)
- Field constraints (`.max(100)` for character limits)
- Default values (`.default([])`)

### 3. Layout Configuration

Each page type has a **layout config** (`lib/page-layouts/layouts.ts`):

```typescript
export interface PageLayoutConfig {
  allowedBlocks: BlockType[]; // Which block types can exist
  maxBlocks: Record<BlockType, number>; // Max count per type
  minBlocks?: Record<BlockType, number>; // Min count per type
  requiredBlocks: BlockType[]; // Must have at least 1
}
```

**Layout config defines:**

- Which blocks are allowed on a page type
- How many of each block type
- Which blocks are required

## Required Field Indicator (\*)

### Current Implementation

The `*` indicator is passed **manually** via the `required` prop:

```tsx
<FormHeading
  label="Location Name"
  required // Shows * indicator
  htmlFor="name"
/>
```

### How to Know What's Required

Look at the **Zod schema** for the block:

| Schema Pattern    | Required? | UI Treatment                      |
| ----------------- | --------- | --------------------------------- |
| `.min(1, "...")`  | ✅ Yes    | Pass `required` prop              |
| `.optional()`     | ❌ No     | Don't pass `required`             |
| `.default(value)` | ❌ No     | Has fallback value                |
| Array `.min(1)`   | ✅ Yes    | Pass `required` + `minImages={1}` |

### Example: LocationBlock Fields

From the schema:

```typescript
content: z.object({
  name: z.string().min(1, "..."),        // REQUIRED
  address: z.string().min(1, "..."),     // REQUIRED
  phone: z.string().optional(),          // OPTIONAL
  description: z.string().optional(),    // OPTIONAL
  images: z.array(...).min(1, "..."),    // REQUIRED (min 1)
})
```

In the component:

```tsx
<FormHeading label="Location Name" required />     // ✅ Has *
<FormHeading label="Address" required />           // ✅ Has *
<FormHeading label="Phone" />                      // No *
<FormHeading label="Description" />                // No *
<ImageListField label="Photos" required minImages={1} />  // ✅ Has *
```

### Future Enhancement

A future improvement could auto-derive `required` from schemas:

```typescript
// Pseudo-code for future enhancement
function isFieldRequired(schema: ZodSchema, fieldPath: string): boolean {
  const fieldSchema = getFieldSchema(schema, fieldPath);
  return !fieldSchema.isOptional() && !fieldSchema.hasDefault();
}
```

## Block Component Structure

### Standard Block Component Pattern

```tsx
export function ExampleBlock({
  block,
  isEditing,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: ExampleBlockProps) {
  // 1. Local state for editing
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 2. Pending uploads state (for deferred upload pattern)
  const [pendingFiles, setPendingFiles] = useState<Map<number, PendingFile>>(new Map());

  // 3. Deleted state
  if (block.isDeleted) {
    return <DeletedBlockOverlay onRestore={onRestore}>...</DeletedBlockOverlay>;
  }

  // 4. Display mode (public view)
  if (!isEditing) {
    return <ExampleDisplay block={block} />;
  }

  // 5. Validation (matches schema requirements)
  const validateBlock = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editedBlock.content.name?.trim()) {
      newErrors.name = "Name is required";  // Matches schema .min(1)
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 6. Save with async upload
  const handleSave = async () => {
    if (!validateBlock()) return;
    // Upload pending files, then call onUpdate
  };

  // 7. Edit mode with dialog
  return (
    <>
      <BlockDialog open={isDialogOpen} onOpenChange={...}>
        <FieldGroup>
          <Field>
            <FormHeading label="Name" required />
            <Input ... />
          </Field>
          {/* More fields... */}
        </FieldGroup>
      </BlockDialog>
      <EditableBlockWrapper onEdit={() => setIsDialogOpen(true)}>
        <ExampleDisplay block={editedBlock} />
      </EditableBlockWrapper>
    </>
  );
}
```

## Reusable Form Components

### ImageField (Single Image)

For blocks with a single image:

```tsx
<ImageField
  label="Hero Image"
  required
  value={block.content.imageUrl}
  pendingFile={pendingFile}
  previewUrl={previewUrl}
  onFileSelect={(file, preview) => { ... }}
  showAltText
  altText={block.content.imageAlt}
  onAltTextChange={(alt) => { ... }}
  error={errors.imageUrl}
/>
```

### ImageListField (Multiple Images)

For blocks with multiple images:

```tsx
<ImageListField
  label="Photos"
  required
  minImages={1}  // Matches schema .min(1)
  images={block.content.images}
  onChange={(images) => { ... }}
  pendingFiles={pendingFiles}
  onFileSelect={(index, file, preview) => { ... }}
/>
```

**Features:**

- Card per image with "Image X of Y" header
- Reorder buttons (↑↓)
- Add button (+) on each card
- Delete disabled when at minImages
- Alt text field (required) with character count

### FormHeading

Standard field label with validation states:

```tsx
<FormHeading
  label="Field Name"
  required // Shows * indicator
  htmlFor="field-id" // Links to input
  validationType="error"
  errorMessage="Custom error message"
  isDirty={hasChanges}
/>
```

## Deferred Upload Pattern

Images are **not uploaded immediately** when selected. Instead:

1. User selects file → stored in `pendingFiles` state with preview URL
2. User clicks Save → all pending files uploaded sequentially
3. Upload success → URLs merged into block content
4. Block saved with final URLs

This pattern:

- Prevents orphan uploads (user cancels dialog)
- Allows reordering before upload
- Provides instant preview feedback
- Batches uploads on save

## Adding a New Block Type

1. **Define schema** in `lib/blocks/schemas.ts`:

   ```typescript
   export const newBlockSchema = baseBlockSchema.extend({
     type: z.literal("newBlock"),
     content: z.object({
       title: z.string().min(1, "Required"),
       // ...
     }),
   });
   ```

2. **Add to discriminated union**:

   ```typescript
   export const blockSchema = z.discriminatedUnion("type", [
     // ...existing
     newBlockSchema,
   ]);
   ```

3. **Export type**:

   ```typescript
   export type NewBlock = z.infer<typeof newBlockSchema>;
   ```

4. **Add to BLOCK_TYPES and BLOCK_METADATA**

5. **Add createBlock case** with default values

6. **Create component** in `components/blocks/NewBlock.tsx`

7. **Add to layout config** for relevant page types

8. **Add to render-block.tsx** switch statement

## File Structure

```
lib/
  blocks/
    schemas.ts          # Zod schemas for all block types
  page-layouts/
    layouts.ts          # PageLayoutConfig type & PAGE_LAYOUTS map
    types.ts            # LayoutRenderer, BlockHandlers types
    single-column.tsx   # Generic page layout
    two-column.tsx      # About page layout
    location-info.tsx   # Cafe page layout
    accordion.tsx       # FAQ page layout
    render-block.tsx    # Block type → component switch

components/
  blocks/
    BlockDialog.tsx     # Standard dialog wrapper
    EditableBlockWrapper.tsx
    DeletedBlockOverlay.tsx
    HeroBlock.tsx
    LocationBlock.tsx
    CarouselBlock.tsx
    # ... other blocks
  app-components/
    ImageField.tsx      # Single image with alt text
    ImageListField.tsx  # Multiple images with reorder
  ui/
    app/
      FormHeading.tsx   # Standard field label
    field.tsx           # shadcn Field components
```

## Validation Flow

```
User clicks Save
      ↓
Block component validateBlock()
      ↓
If errors → set errors state, show inline messages
      ↓
If valid → upload pending files
      ↓
Call onUpdate(finalBlock)
      ↓
PageEditor validates with blockSchema.safeParse()
      ↓
If valid → save to database
If invalid → show error toast
```

---

**Last Updated**: December 3, 2025
