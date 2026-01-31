# Settings Field Pattern

## Overview

The `SettingsField` component is a reusable, configuration-based solution for managing admin settings. It eliminates repetitive boilerplate code by handling all common concerns automatically: fetching, state management, saving, dirty tracking, and toast notifications.

## Problem It Solves

**Before**: Each setting required ~50 lines of repetitive code:

```typescript

const [settings, setSettings] = useState({});
const [originalSettings, setOriginalSettings] = useState({});
const [saving, setSaving] = useState(false);

useEffect(() => {
  const fetchSettings = async () => {
    // 20 lines of fetch logic
  };
  fetchSettings();
}, []);

const handleSave = async () => {
  // 20 lines of save logic with toast
};

const isDirty = settings.field !== originalSettings.field;

return (
  <div>
    <Input value={settings.field} onChange={...} />
    <Button onClick={handleSave} disabled={!isDirty || saving}>
      Save
    </Button>
  </div>
);
```

**After**: Each setting requires ~10 lines of configuration:

```tsx

<SettingsField
  endpoint="/api/admin/settings/branding"
  field="storeName"
  label="Store Name"
  description="Your store's name as shown in the header"
/>
```

## Basic Usage

```typescript

import SettingsField from "@/components/admin/SettingsField";

<SettingsField
  endpoint="/api/admin/settings/branding"
  field="storeName"
  label="Store Name"
  description="Displayed in header, footer, and browser title"
/>;
```

## Custom Input Components

Use the `input` render prop for custom components:

```typescript

<SettingsField
  endpoint="/api/admin/settings/product-menu"
  field="icon"
  label="Menu Icon"
  input={(value, onChange, isDirty) => (
    <IconPicker
      value={value}
      onValueChange={onChange}
      className={isDirty ? "border-amber-500" : ""}
    />
  )}
/>
```

### Textarea Example

```typescript

<SettingsField
  endpoint="/api/admin/settings/branding"
  field="description"
  label="Store Description"
  input={(value, onChange, isDirty) => (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className={`flex min-h-20 w-full rounded-md border ${
        isDirty ? "border-amber-500" : "border-input"
      } bg-background px-3 py-2 text-sm...`}
    />
  )}
/>
```

### Switch Example

```typescript

<SettingsField
  endpoint="/api/admin/settings/newsletter"
  field="enabled"
  label="Enable Newsletter"
  input={(value, onChange, isDirty) => (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value || false}
        onCheckedChange={onChange}
        className={isDirty ? "ring-2 ring-amber-500" : ""}
      />
      <Label className="text-sm text-muted-foreground">
        {value ? "Enabled" : "Disabled"}
      </Label>
    </div>
  )}
/>
```

### RadioGroup Example

```typescript

<SettingsField
  endpoint="/api/admin/settings/weight-unit"
  field="weightUnit"
  label="Weight Display Unit"
  input={(value, onChange, isDirty) => (
    <RadioGroup
      value={value || "ounces"}
      onValueChange={onChange}
      className={isDirty ? "border-amber-500 border rounded-md p-4" : ""}
    >
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="ounces" id="ounces" />
        <Label htmlFor="ounces">Ounces (oz)</Label>
      </div>
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="grams" id="grams" />
        <Label htmlFor="grams">Grams (g)</Label>
      </div>
    </RadioGroup>
  )}
/>
```

## Transform Functions

Use `transformSave` and `transformLoad` for complex data:

```typescript

<SettingsField
  endpoint="/api/admin/settings/social"
  field="links"
  label="Social Links"
  transformLoad={(data) => JSON.parse(data.links)}
  transformSave={(value) => ({ links: JSON.stringify(value) })}
  input={(value, onChange) => (
    <SocialLinksEditor value={value} onChange={onChange} />
  )}
/>
```

## API Props

```typescript

interface SettingsFieldProps<T = string> {
  endpoint: string; // API endpoint (GET/PUT/PATCH/POST)
  field: string; // Field name in settings object
  label: string; // Display label
  description?: string; // Help text below input
  method?: "PUT" | "PATCH" | "POST"; // HTTP method (default PUT)
  input?: (value: T, onChange: (v: T) => void, isDirty: boolean) => ReactNode;
  transformSave?: (
    value: T,
    allSettings: Record<string, any>
  ) => Record<string, any>;
  transformLoad?: (data: Record<string, any>) => T;
  defaultValue?: T; // Fallback if fetch fails
}
```

## What It Handles Automatically

1. **Fetching**: Calls endpoint on mount, handles loading state
2. **State Management**: Tracks current value and original value
3. **Dirty Checking**: Compares value !== originalValue inline
4. **Saving**: Sends to endpoint with toast notifications
5. **Loading UI**: Shows skeleton during fetch
6. **Error Handling**: Toast on fetch/save errors
7. **isDirty State**: Passes to custom inputs for border styling

## Settings Page Structure

Settings are organized into dedicated pages with sidebar navigation:

```text
/admin/settings          → General (store name, tagline, description)
/admin/settings/storefront → Store Front (product menu, add-ons)
/admin/settings/location   → Location (café setup)
/admin/settings/commerce   → Commerce (weight unit, shipping)
/admin/settings/marketing  → Marketing (social, newsletter)
/admin/settings/contact    → Contact (email, footer, hours)
```

## Creating a New Settings Page

1. Create file: `app/admin/settings/[section]/page.tsx`
2. Add to navigation in `app/admin/settings/layout.tsx`
3. Use SettingsField components in page

Example:

```typescript

import { requireAdmin } from "@/lib/admin";
import SettingsField from "@/components/admin/SettingsField";

export const metadata = {
  title: "Section Settings | Admin",
  description: "Configure section settings",
};

export default async function SectionSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Section Settings</h2>
        <p className="text-muted-foreground mt-2">
          Description of this section
        </p>
      </div>

      <div className="space-y-6">
        <SettingsField
          endpoint="/api/admin/settings/section"
          field="fieldName"
          label="Field Label"
          description="Field description"
        />
      </div>
    </div>
  );
}
```

## API Endpoint Requirements

Each settings endpoint should:

1. Support GET method to fetch settings
2. Support PUT/PATCH/POST to save settings
3. Return settings object with the field
4. Validate input with Zod

Example:

```typescript

// GET /api/admin/settings/branding
export async function GET() {
  const settings = await prisma.setting.findFirst();
  return NextResponse.json(settings || {});
}

// PUT /api/admin/settings/branding
export async function PUT(req: Request) {
  const body = await req.json();
  const schema = z.object({
    storeName: z.string().optional(),
    tagline: z.string().optional(),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const settings = await prisma.setting.upsert({
    where: { id: 1 },
    update: result.data,
    create: result.data,
  });

  return NextResponse.json(settings);
}
```

## Patterns to Avoid

### ❌ Don't Create Section Components

Each section component just duplicates fetch/save/state logic:

```typescript

// BAD: BrandingSettings.tsx (300 lines of duplication)
const [settings, setSettings] = useState({});
const [original, setOriginal] = useState({});
const fetch = async () => {
  /* ... */
};
const save = async () => {
  /* ... */
};
```

### ✅ Do Use SettingsField Configuration

```tsx

// GOOD: Direct SettingsField usage (10 lines per field)
<SettingsField endpoint="..." field="..." label="..." />
```

## Special Cases

### FileUpload Components

FileUpload components handle their own upload and don't fit the SettingsField pattern. Keep them in dedicated sections:

```typescript

<div className="space-y-6">
  <div>
    <Label>Store Logo</Label>
    <FileUpload
      endpoint="/api/upload"
      onUploadComplete={(url) => {
        // Save URL to settings
      }}
    />
  </div>
</div>
```

### Complex Multi-Field Sections

For sections with complex interdependencies, create a dedicated component but use SettingsField internally:

```typescript

function SocialLinksSection() {
  return (
    <div className="space-y-4">
      <SettingsField endpoint="..." field="facebook" label="Facebook" />
      <SettingsField endpoint="..." field="twitter" label="Twitter" />
      <SettingsField endpoint="..." field="instagram" label="Instagram" />
    </div>
  );
}
```

## Benefits

1. **DRY**: Eliminates 50+ lines of boilerplate per field → 10 lines configuration
2. **Consistent**: All settings behave the same way (fetch, save, dirty, toast)
3. **Maintainable**: Changes to pattern only need updating SettingsField component
4. **Flexible**: Custom inputs via render props, transforms for complex data
5. **Type-safe**: TypeScript generics for value types
6. **Discoverable**: All settings organized in dedicated pages with navigation

## Migration Path

1. Create new settings page using SettingsField
2. Test fetch/save/dirty tracking works
3. Delete old monolithic component sections
4. Add new page to navigation
5. Repeat for each section
