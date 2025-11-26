# AI-Powered About Page Generator

## Overview

An interactive Q&A wizard that guides store owners through creating their About page content, then uses AI (Gemini) to generate compelling, authentic brand storytelling based on their responses.

## User Flow

```
Admin clicks: "Create About Page with AI"
  ↓
Interactive Q&A Wizard (10 questions across 4 sections)
  ↓
AI generates 2-3 content variations
  ↓
Store owner selects preferred version
  ↓
Review & edit in rich text editor
  ↓
Save as draft or publish
  ↓
Can regenerate or manually edit anytime
```

---

## The Interview Questions

### Section 1: Origin Story (Questions 1-3)

**Q1: What inspired you to start this coffee business?**

- Type: Long textarea (500 chars)
- Purpose: Capture authentic founding story
- Example: "I fell in love with coffee while traveling through Ethiopia and wanted to bring that experience to my community..."
- Required: Yes

**Q2: When did you start? What are some key milestones?**

- Year founded: Text input (4 digits)
- Key moments: Textarea (300 chars)
- Purpose: Establish timeline and credibility
- Example: "Founded 2018. Opened our roastery in 2020. Won Best New Roaster award 2021."
- Required: Year only

**Q3: Who is behind the business?**

- Founder name(s): Text input
- Founder title: Text input (e.g., "Founder & Head Roaster")
- Founder photo: File upload (optional)
- Purpose: Humanize the brand
- Required: Name and title

---

### Section 2: Values & Mission (Questions 4-6)

**Q4: What do you care most about?**

- Type: Multi-select checkboxes
- Options:
  - [ ] Quality & craftsmanship
  - [ ] Sustainability & environment
  - [ ] Community & relationships
  - [ ] Education & knowledge sharing
  - [ ] Fair trade & ethical sourcing
  - [ ] Innovation & experimentation
  - [ ] Tradition & heritage
  - [ ] Other: [text input]
- Purpose: Identify core values
- Required: At least 2

**Q5: What makes your coffee different from others?**

- Type: Textarea (400 chars)
- Purpose: Unique value proposition
- Example: "We only source from women-owned farms and roast in small 5kg batches to highlight each origin's unique characteristics."
- Required: Yes

**Q6: What's your roasting philosophy or approach?**

- Type: Textarea (300 chars)
- Purpose: Technical differentiation
- Example: "Light to medium roasts that celebrate the coffee's origin. We prefer to highlight acidity and sweetness rather than roast flavors."
- Required: No

---

### Section 3: Products & Process (Questions 7-8)

**Q7: Where do you source your coffee from?**

- Type: Text input (200 chars)
- Purpose: Establish sourcing practices
- Example: "Direct trade relationships with farmers in Colombia, Ethiopia, Guatemala, and Kenya"
- Required: Yes

**Q8: Do you have a physical location?**

- Type: Radio buttons
  - ( ) Yes - Café/Roastery
  - ( ) Online only
  - ( ) Wholesale/Retail partnerships
- If "Yes" selected:
  - Location: Text input (e.g., "Portland, Oregon")
  - What's special about the space: Textarea (200 chars)
  - Example: "Our café features an open roasting area where customers can watch the process and ask questions."
- Purpose: Establish business model and accessibility
- Required: Yes

---

### Section 4: Voice & Personality (Questions 9-10)

**Q9: How would you describe your brand personality?**

- Type: Dropdown select
- Options:
  - Professional & sophisticated
  - Warm & approachable
  - Bold & edgy
  - Artisanal & traditional
  - Modern & innovative
  - Community-focused & inclusive
  - Playful & experimental
- Purpose: Guide AI tone and style
- Required: Yes

**Q10: Any quotes, sayings, or philosophies that represent your brand?**

- Type: Textarea (200 chars)
- Purpose: Include memorable quotes in narrative
- Example: "Coffee should make you think twice about how you start your day."
- Required: No

---

## AI Generation System

### System Prompt

```typescript
const ABOUT_PAGE_GENERATOR_SYSTEM_PROMPT = `You are an expert copywriter specializing in specialty coffee brand storytelling for independent roasters and café owners.

Your task is to create a compelling "About Us" page that:
1. Tells an authentic origin story with specific details (avoid generic platitudes)
2. Highlights unique values and differentiators clearly
3. Creates emotional connection through personal narrative
4. Maintains the brand's chosen tone and personality throughout
5. Uses appropriate coffee industry language (not overly technical)
6. Follows this structure:
   - Opening hook or quote (if provided)
   - Origin story (how/why they started)
   - Values & mission (what they stand for)
   - Process & sourcing (what makes their coffee unique)
   - Call-to-action or invitation

Format Requirements:
- Generate content in clean HTML format
- Use semantic tags: <h2>, <h3>, <p>, <strong>, <em>
- Create 3-4 distinct sections with appropriate headings
- Keep paragraphs concise (3-5 sentences max)
- Include the founder's quote as a pull quote if provided
- Total length: 600-900 words

DO NOT:
- Use generic phrases like "passion for coffee" unless specifically mentioned
- Include placeholder text like [Your Name] or [Location]
- Write in first person unless founder story requires it
- Make up facts or details not provided in the input

Be specific, concrete, and authentic based on the provided details.`;
```

### User Prompt Template

```typescript
function buildUserPrompt(answers: WizardAnswers): string {
  return `
Create an About page for a specialty coffee business with these details:

=== ORIGIN STORY ===
Founded: ${answers.yearFounded || "Recently established"}
Founding inspiration: ${answers.inspiration}
Founder: ${answers.founderName}, ${answers.founderTitle}
${answers.milestones ? `Key milestones: ${answers.milestones}` : ""}

=== VALUES & DIFFERENTIATORS ===
Core values: ${answers.values.join(", ")}
What makes them unique: ${answers.uniqueness}
${answers.roastingPhilosophy ? `Roasting philosophy: ${answers.roastingPhilosophy}` : ""}

=== SOURCING & BUSINESS MODEL ===
Coffee origins: ${answers.sourceLocations}
Business type: ${answers.businessType}
${
  answers.hasPhysicalLocation === "yes"
    ? `Physical location: ${answers.location}\nSpace description: ${answers.locationDetails}`
    : "Online-only business"
}

=== BRAND PERSONALITY ===
Tone: ${answers.brandPersonality}
${answers.brandQuote ? `Featured quote: "${answers.brandQuote}"` : ""}

Generate a compelling About page that tells their story authentically and memorably.
  `.trim();
}
```

### Generation Variations

Generate **2-3 style variations** for user to choose from:

#### Variation 1: Story-First

- Opens with founder's inspiration
- Personal, narrative-driven
- Uses "we" voice
- Emotional connection emphasis

#### Variation 2: Values-First

- Opens with mission statement
- Clear, direct language
- Emphasizes what they stand for
- Data/fact-driven where applicable

#### Variation 3: Product-First

- Opens with coffee quality/sourcing
- Technical but accessible
- Emphasizes craftsmanship
- Process-oriented narrative

---

## Database Schema Additions

```prisma
model Page {
  // ... existing fields from pages-cms-architecture.md ...

  // AI Generation metadata
  generatedBy      String?   // "ai" | "manual"
  generationPrompt Json?     // Store complete Q&A answers
  generatedAt      DateTime?
}
```

**Example stored prompt**:

```json
{
  "inspiration": "Fell in love with coffee in Ethiopia...",
  "yearFounded": "2018",
  "founderName": "Sarah Chen",
  "founderTitle": "Founder & Head Roaster",
  "values": ["Quality & craftsmanship", "Sustainability & environment"],
  "uniqueness": "Only source from women-owned farms...",
  "roastingPhilosophy": "Light roasts that highlight origin...",
  "sourceLocations": "Colombia, Ethiopia, Kenya",
  "businessType": "yes",
  "location": "Portland, Oregon",
  "locationDetails": "Open roasting area...",
  "brandPersonality": "Warm & approachable",
  "brandQuote": "Coffee should make you think twice..."
}
```

---

## Admin UI Components

### 1. Wizard Landing Page

```
/admin/pages/new

[Card: Manual Creation]
Create a page from scratch with our rich text editor.
[Create Manually]

[Card: AI-Powered About Page] ✨ RECOMMENDED
Answer 10 quick questions and let AI write your About page.
Perfect for first-time setup!
[Start AI Wizard]
```

### 2. Wizard Interface

```typescript
// /admin/pages/new/wizard

export default function AboutPageWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          ✨ Create Your About Page
        </h1>
        <p className="text-muted-foreground mt-2">
          Answer a few questions about your business, and AI will write
          a compelling About page for you.
        </p>
      </div>

      {/* Progress */}
      <ProgressIndicator
        currentStep={step}
        totalSteps={10}
        sections={[
          { name: 'Origin Story', steps: 3 },
          { name: 'Values', steps: 3 },
          { name: 'Business', steps: 2 },
          { name: 'Personality', steps: 2 }
        ]}
      />

      {/* Question Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {renderQuestion(step)}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          ← Back
        </Button>

        {step < 10 ? (
          <Button onClick={handleNext}>
            Next →
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              '✨ Generate My About Page'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 3. Variation Selector

```typescript
// After AI generates 2-3 versions

function VariationSelector({ variations, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm text-blue-900">
          ✨ AI generated 3 different takes on your story.
          Choose the one that feels right, then edit to perfection!
        </p>
      </div>

      {variations.map((content, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold">
                {getVariationTitle(index)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getVariationDescription(index)}
              </p>
            </div>
            <Button onClick={() => onSelect(content)}>
              Use This One →
            </Button>
          </div>

          {/* Preview */}
          <div
            className="prose prose-sm max-w-none line-clamp-10"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Card>
      ))}

      <Button variant="outline" onClick={onRegenerate}>
        🔄 Not quite right? Regenerate
      </Button>
    </div>
  );
}

function getVariationTitle(index: number): string {
  const titles = [
    'Story-First Approach',
    'Values-First Approach',
    'Product-First Approach'
  ];
  return titles[index];
}

function getVariationDescription(index: number): string {
  const descriptions = [
    'Personal narrative focus, emotional connection',
    'Mission-driven, clear values emphasis',
    'Craftsmanship focus, process-oriented'
  ];
  return descriptions[index];
}
```

### 4. Review & Edit Screen

```typescript
function ReviewAndEdit({ content, answers, onSave, onRegenerate }) {
  const [editedContent, setEditedContent] = useState(content);
  const [showInputs, setShowInputs] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Review Your About Page
        </h1>
        <p className="text-muted-foreground">
          Edit the content below, or regenerate if you'd like a different take.
        </p>
      </div>

      {/* Rich Text Editor */}
      <Card className="p-6 mb-6">
        <TipTapEditor
          content={editedContent}
          onChange={setEditedContent}
          placeholder="Edit your About page content..."
        />
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowInputs(!showInputs)}
          >
            {showInputs ? 'Hide' : 'View'} Original Answers
          </Button>

          <Button
            variant="outline"
            onClick={onRegenerate}
          >
            ✨ Regenerate with AI
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onSave(editedContent, false)}
          >
            Save as Draft
          </Button>

          <Button onClick={() => onSave(editedContent, true)}>
            Publish Now
          </Button>
        </div>
      </div>

      {/* Show original inputs if toggled */}
      {showInputs && (
        <Card className="mt-6 p-6 bg-muted">
          <h3 className="font-bold mb-4">Your Original Answers</h3>
          <dl className="space-y-3 text-sm">
            {Object.entries(answers).map(([key, value]) => (
              <div key={key}>
                <dt className="font-semibold text-muted-foreground">
                  {formatQuestionKey(key)}
                </dt>
                <dd>{Array.isArray(value) ? value.join(', ') : value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}
```

---

## API Implementation

### Generation Endpoint

````typescript
// app/api/admin/pages/generate-about/route.ts

import { requireAdminApi } from "@/lib/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  await requireAdminApi();

  const { answers } = await request.json();

  // Validate required fields
  const required = ["inspiration", "founderName", "founderTitle", "uniqueness"];
  for (const field of required) {
    if (!answers[field]) {
      return Response.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  // Generate 3 variations
  const variations = await Promise.all([
    generateVariation(answers, "story-first"),
    generateVariation(answers, "values-first"),
    generateVariation(answers, "product-first"),
  ]);

  return Response.json({
    variations,
    prompt: answers, // Store for regeneration
  });
}

async function generateVariation(
  answers: WizardAnswers,
  style: "story-first" | "values-first" | "product-first"
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.8, // Creative but not too random
      maxOutputTokens: 1500,
    },
  });

  const systemPrompt = ABOUT_PAGE_GENERATOR_SYSTEM_PROMPT;
  const styleGuidance = getStyleGuidance(style);
  const userPrompt = buildUserPrompt(answers);

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: styleGuidance },
    { text: userPrompt },
  ]);

  const content = result.response.text();

  // Clean up (remove markdown code fences if present)
  return content
    .replace(/```html\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

function getStyleGuidance(style: string): string {
  const guidance = {
    "story-first":
      "Focus on the founder's personal journey and inspiration. Open with the founding story. Use warm, narrative language.",
    "values-first":
      "Lead with mission and values. Use clear, direct language. Emphasize what they stand for.",
    "product-first":
      "Start with coffee quality and sourcing. Emphasize craftsmanship and process. Use precise, professional language.",
  };
  return guidance[style];
}
````

---

## Implementation Timeline

### Day 1: Wizard UI Foundation

- [ ] Create wizard route structure
- [ ] Build question components
- [ ] Implement progress tracking
- [ ] Add form validation
- [ ] Style with animations

### Day 2: AI Integration

- [ ] Create generation API route
- [ ] Implement system/user prompts
- [ ] Generate 3 variations
- [ ] Handle errors and retries
- [ ] Add loading states

### Day 3: Review & Save Flow

- [ ] Build variation selector
- [ ] Integrate TipTap editor
- [ ] Implement save/publish logic
- [ ] Store generation metadata
- [ ] Add regeneration capability

### Day 4: Polish & Testing

- [ ] Add preview mode
- [ ] Improve error messages
- [ ] Test all edge cases
- [ ] Optimize prompts based on output quality
- [ ] Documentation

---

## Success Metrics

**User Experience**:

- [ ] Wizard completion time < 10 minutes
- [ ] At least 1 of 3 variations is satisfactory (>80% of users)
- [ ] Regeneration needed < 30% of time
- [ ] Users publish within 5 minutes of generation

**Technical**:

- [ ] AI generation time < 10 seconds
- [ ] Error rate < 2%
- [ ] Generated content requires < 20% editing on average

**Business**:

- [ ] 80%+ of new stores use AI wizard vs manual creation
- [ ] Generated About pages drive engagement (track analytics)

---

## Future Enhancements

### Phase 2: Café Page Generator

- Add similar Q&A wizard for café/location pages
- Questions: address, hours, atmosphere, menu highlights
- Generate descriptions and format details

### Phase 3: Inline AI Assistant

- "Improve this section" button in editor
- "Make this more [tone]" options
- "Expand this paragraph" feature
- Context-aware suggestions

### Phase 4: Multi-Language Generation

- Generate in store owner's language
- Auto-translate to multiple languages
- Maintain brand voice across translations

---

**Status**: Approved for implementation  
**Timeline**: 3-4 days  
**Version**: v0.27.0  
**Dependencies**: Pages CMS architecture (see `pages-cms-architecture.md`)
