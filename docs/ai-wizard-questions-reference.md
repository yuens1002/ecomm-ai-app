# AI About Page Wizard - Complete Q&A Reference

## Quick Overview

10 questions across 4 sections that capture everything needed to generate an authentic About page.

---

## Section 1: Origin Story (3 questions)

### Question 1: Founding Inspiration

**Prompt**: "What inspired you to start this coffee business?"

**Type**: Long textarea (500 characters)

**Helper text**: "Tell us your story. What drew you to coffee? Was there a specific moment or experience?"

**Examples**:

- "I fell in love with coffee while volunteering in Ethiopia. I wanted to bring that experience and those relationships back to my community."
- "After 10 years as a corporate lawyer, I realized I wanted to create something with my hands. Coffee became my creative outlet."
- "My grandmother ran a café in Colombia. I'm honoring her legacy by bringing specialty coffee to our neighborhood."

**Validation**: Required, minimum 50 characters

**Why we ask**: Captures the authentic founding story and emotional hook

---

### Question 2: Timeline & Milestones

**Prompt**: "When did you start? What are some key moments in your journey?"

**Type**:

- Year founded: Text input (4 digits, 1900-2025)
- Key milestones: Textarea (300 characters)

**Helper text**: "Major events like opening your first café, winning awards, or reaching important milestones"

**Examples**:

- Year: 2018
- Milestones: "Started roasting in my garage. Opened our first café in 2020. Won Portland's Best New Roaster award in 2021. Now supplying 15 wholesale partners."

**Validation**: Year required, milestones optional

**Why we ask**: Establishes credibility and timeline of growth

---

### Question 3: Who's Behind It

**Prompt**: "Who is behind this business?"

**Type**:

- Founder name(s): Text input
- Founder title: Text input
- Founder photo: File upload (optional)

**Helper text**: "Your name and role. If multiple founders, separate with commas."

**Examples**:

- Name: "Sarah Chen"
- Title: "Founder & Head Roaster"
- Name: "Marcus & Elena Rodriguez"
- Title: "Co-Founders"

**Validation**: Name and title required

**Why we ask**: Humanizes the brand, provides photo for page

---

## Section 2: Values & Mission (3 questions)

### Question 4: Core Values

**Prompt**: "What do you care most about? (Select all that apply)"

**Type**: Multi-select checkboxes

**Options**:

- [ ] Quality & craftsmanship
- [ ] Sustainability & environment
- [ ] Community & relationships
- [ ] Education & knowledge sharing
- [ ] Fair trade & ethical sourcing
- [ ] Innovation & experimentation
- [ ] Tradition & heritage
- [ ] Accessibility & inclusivity
- [ ] Local & artisanal
- [ ] Other: ****\_\_\_\_****

**Helper text**: "Choose 2-5 values that guide your business decisions"

**Validation**: Minimum 2 selections

**Why we ask**: Identifies what to emphasize in values section

---

### Question 5: Unique Differentiator

**Prompt**: "What makes your coffee different from others?"

**Type**: Textarea (400 characters)

**Helper text**: "What would you tell someone asking why they should buy from you? Be specific!"

**Examples**:

- "We only source from women-owned farms and roast in small 5kg batches to highlight each origin's unique characteristics."
- "Every coffee we sell scores 86+ points. We pay 2-3x Fair Trade prices and visit every farm we buy from."
- "We're the only roastery in the Southwest specializing in natural-processed African coffees with detailed tasting notes."

**Validation**: Required, minimum 50 characters

**Why we ask**: Core unique value proposition for About page

---

### Question 6: Roasting Philosophy

**Prompt**: "What's your roasting philosophy or approach?"

**Type**: Textarea (300 characters)

**Helper text**: "How do you roast? What's your style? (Optional but recommended)"

**Examples**:

- "Light to medium roasts that celebrate the coffee's origin. We prefer to highlight acidity and sweetness rather than roast flavors."
- "We roast dark and bold because we believe coffee should have punch. We're not afraid of roast development."
- "Every coffee gets a custom profile. We cup every batch and adjust based on the bean's density and moisture content."

**Validation**: Optional

**Why we ask**: Technical differentiation, shows expertise

---

## Section 3: Products & Process (2 questions)

### Question 7: Sourcing Locations

**Prompt**: "Where do you source your coffee from?"

**Type**: Text input (200 characters)

**Helper text**: "Countries or regions. Mention if you have direct trade relationships."

**Examples**:

- "Direct trade relationships with farmers in Colombia, Ethiopia, Guatemala, and Kenya"
- "We source from co-ops in Central and South America, focusing on organic and shade-grown coffees"
- "Single-origin coffees from East Africa and Indonesia, with yearly buying trips to visit farms"

**Validation**: Required

**Why we ask**: Establishes sourcing quality and ethics

---

### Question 8: Physical Location

**Prompt**: "Do you have a physical location customers can visit?"

**Type**: Radio buttons with conditional fields

**Options**:

- ( ) Yes - We have a café, roastery, or storefront
- ( ) Online only - We sell exclusively online
- ( ) Wholesale/Retail - We supply other businesses or stores

**If "Yes" selected:**

- **Location**: Text input (e.g., "Portland, Oregon" or "Downtown Seattle")
- **What's special about the space**: Textarea (200 characters)
  - Example: "Our café features an open roasting area where customers can watch the process and ask questions."

**Validation**: Selection required

**Why we ask**: Determines business model, sets customer expectations

---

## Section 4: Voice & Personality (2 questions)

### Question 9: Brand Personality

**Prompt**: "How would you describe your brand personality?"

**Type**: Dropdown select

**Options**:

- Professional & sophisticated
- Warm & approachable
- Bold & edgy
- Artisanal & traditional
- Modern & innovative
- Community-focused & inclusive
- Playful & experimental
- Educational & nerdy

**Helper text**: "This helps us match the writing tone to your brand"

**Validation**: Required

**Why we ask**: Guides AI tone, style, and language choices

---

### Question 10: Brand Quote or Philosophy

**Prompt**: "Any quotes, sayings, or philosophies that represent your brand?"

**Type**: Textarea (200 characters)

**Helper text**: "A motto, favorite saying, or philosophy you live by (optional)"

**Examples**:

- "Coffee should make you think twice about how you start your day."
- "Slow down, drink good coffee, connect with people."
- "Quality over quantity, always."
- "Coffee is a fruit. Treat it like one."

**Validation**: Optional

**Why we ask**: Can be featured as pull quote in About page

---

## Complete Data Structure

```typescript

interface WizardAnswers {
  // Section 1: Origin Story
  inspiration: string; // Q1
  yearFounded: string; // Q2
  milestones?: string; // Q2
  founderName: string; // Q3
  founderTitle: string; // Q3
  founderPhoto?: File; // Q3

  // Section 2: Values & Mission
  values: string[]; // Q4 (array of selected options)
  uniqueness: string; // Q5
  roastingPhilosophy?: string; // Q6

  // Section 3: Products & Process
  sourceLocations: string; // Q7
  businessType: "yes" | "online" | "wholesale"; // Q8
  location?: string; // Q8 conditional
  locationDetails?: string; // Q8 conditional

  // Section 4: Voice & Personality
  brandPersonality: string; // Q9
  brandQuote?: string; // Q10
}
```

---

## Question Flow & Logic

### Skip Logic

- Q8: Only show location fields if "Yes - café/roastery" selected
- All others: Always shown

### Validation Rules

```typescript

const validationRules = {
  inspiration: { required: true, minLength: 50 },
  yearFounded: { required: true, pattern: /^\d{4}$/, min: 1900, max: 2025 },
  milestones: { required: false },
  founderName: { required: true, minLength: 2 },
  founderTitle: { required: true, minLength: 2 },
  founderPhoto: { required: false },
  values: { required: true, minSelections: 2 },
  uniqueness: { required: true, minLength: 50 },
  roastingPhilosophy: { required: false },
  sourceLocations: { required: true, minLength: 10 },
  businessType: { required: true },
  location: { required: false, requiredIf: businessType === "yes" },
  locationDetails: { required: false },
  brandPersonality: { required: true },
  brandQuote: { required: false },
};
```

### Progress Calculation

```text
Section 1: Steps 1-3 (30%)
Section 2: Steps 4-6 (60%)
Section 3: Steps 7-8 (80%)
Section 4: Steps 9-10 (100%)
```

---

## UI/UX Considerations

### Per-Question Screen

- One question per screen for focus
- Large, comfortable inputs
- Clear labels and helper text
- Examples in placeholder or below field
- Character counter for textareas
- Save progress automatically (localStorage)

### Navigation

- "Back" button always available (except step 1)
- "Next" button enabled when valid
- "Skip" option for optional questions
- Progress bar showing section and overall progress

### Error Handling

- Inline validation on blur
- Clear error messages
- Prevent advancing with invalid data
- Highlight missing required fields

---

## Testing Scenarios

### Happy Path

1. User answers all required questions
2. Provides detailed, thoughtful responses
3. Selects 3-4 values
4. Has physical location with good description
5. Includes brand quote

**Expected**: Generates rich, detailed About page

### Minimal Input

1. User provides minimum required fields only
2. Short, basic responses (50-100 chars)
3. Selects 2 values
4. Online-only business
5. No brand quote

**Expected**: Generates simpler but complete About page

### Edge Cases

- Very long responses (max character limits)
- Special characters in text fields
- Multiple founders with different titles
- "Other" value selection with custom text
- Regeneration after editing answers

---

## Future Question Additions

### Potential Additions (Post-Launch)

- Coffee menu highlights (specific blends/origins)
- Certifications (Organic, Fair Trade, etc.)
- Awards and recognition
- Team size and roles
- Sustainability practices (specific actions)
- Community involvement examples

**Why defer**: Keep initial wizard under 10 minutes, avoid overwhelm

---

**Status**: Approved for implementation  
**Version**: v0.27.0  
**Last Updated**: November 26, 2025
