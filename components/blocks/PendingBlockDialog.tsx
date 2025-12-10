"use client";

import { useState } from "react";
import {
  Block,
  BlockType,
  createBlock,
  BLOCK_METADATA,
  statBlockSchema,
  pullQuoteBlockSchema,
  richTextBlockSchema,
  heroBlockSchema,
  faqItemBlockSchema,
  FAQ_CATEGORIES,
  StatBlock as StatBlockType,
  PullQuoteBlock as PullQuoteBlockType,
  RichTextBlock as RichTextBlockType,
  HeroBlock as HeroBlockType,
  FaqItemBlock as FaqItemBlockType,
} from "@/lib/blocks/schemas";
import { BlockDialog } from "./BlockDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { RichTextEditor } from "@/components/app-components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingBlockDialogProps {
  blockType: BlockType;
  isOpen: boolean;
  onConfirm: (block: Block) => void;
  onCancel: () => void;
}

/**
 * Renders a dialog for creating a new block
 * Uses the same form fields as edit dialogs but starts with empty values
 * Does NOT create anything in DB - that happens in onConfirm
 */
export function PendingBlockDialog({
  blockType,
  isOpen,
  onConfirm,
  onCancel,
}: PendingBlockDialogProps) {
  // Create a temporary block with empty defaults
  const [editedBlock, setEditedBlock] = useState<Block>(() =>
    createEmptyBlock(blockType)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset when dialog opens with new type
  const [lastOpenState, setLastOpenState] = useState({
    isOpen: false,
    blockType: "",
  });

  if (
    isOpen &&
    (!lastOpenState.isOpen || lastOpenState.blockType !== blockType)
  ) {
    setLastOpenState({ isOpen, blockType });
    setEditedBlock(createEmptyBlock(blockType));
    setErrors({});
  } else if (!isOpen && lastOpenState.isOpen) {
    setLastOpenState({ isOpen: false, blockType: "" });
  }

  const metadata = BLOCK_METADATA[blockType];

  const handleSave = () => {
    // Validate based on block type
    const validationResult = validateBlock(blockType, editedBlock);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validationResult.error.issues) {
        const field = err.path[err.path.length - 1] as string;
        fieldErrors[field] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onConfirm(editedBlock);
  };

  const handleCancel = () => {
    setErrors({});
    onCancel();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  // Render appropriate form based on block type
  const renderForm = () => {
    switch (blockType) {
      case "stat":
        return (
          <StatForm
            block={editedBlock as StatBlockType}
            setBlock={setEditedBlock}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "pullQuote":
        return (
          <PullQuoteForm
            block={editedBlock as PullQuoteBlockType}
            setBlock={setEditedBlock}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "richText":
        return (
          <RichTextForm
            block={editedBlock as RichTextBlockType}
            setBlock={setEditedBlock}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "hero":
        return (
          <HeroForm
            block={editedBlock as HeroBlockType}
            setBlock={setEditedBlock}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "faqItem":
        return (
          <FaqItemForm
            block={editedBlock as FaqItemBlockType}
            setBlock={setEditedBlock}
            errors={errors}
            setErrors={setErrors}
          />
        );
      default:
        return (
          <p className="text-muted-foreground">
            Add dialog for {metadata.name} is not yet implemented.
          </p>
        );
    }
  };

  return (
    <BlockDialog
      open={isOpen}
      onOpenChange={handleDialogChange}
      title={`Add ${metadata.name}`}
      description={metadata.description}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add</Button>
        </>
      }
    >
      {renderForm()}
    </BlockDialog>
  );
}

// Create empty block with placeholder values for form
function createEmptyBlock(type: BlockType): Block {
  const base = createBlock(type, 0);

  // Override with empty values for user to fill in
  switch (type) {
    case "stat":
      return {
        ...base,
        content: { label: "", value: "", emoji: undefined },
      } as StatBlockType;
    case "pullQuote":
      return {
        ...base,
        content: { text: "", author: undefined },
      } as PullQuoteBlockType;
    case "richText":
      return {
        ...base,
        content: { html: "" },
      } as RichTextBlockType;
    case "hero":
      return {
        ...base,
        content: { heading: "", imageUrl: "", imageAlt: "", caption: "" },
      } as HeroBlockType;
    case "faqItem":
      return {
        ...base,
        content: { question: "", answer: "", category: "general" },
      } as FaqItemBlockType;
    default:
      return base;
  }
}

// Validate block based on type
function validateBlock(type: BlockType, block: Block) {
  switch (type) {
    case "stat":
      return statBlockSchema.safeParse(block);
    case "pullQuote":
      return pullQuoteBlockSchema.safeParse(block);
    case "richText":
      return richTextBlockSchema.safeParse(block);
    case "hero":
      return heroBlockSchema.safeParse(block);
    case "faqItem":
      return faqItemBlockSchema.safeParse(block);
    default:
      return { success: true, data: block } as const;
  }
}

// Form components for each block type
interface FormProps<T extends Block> {
  block: T;
  setBlock: (block: Block) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

function StatForm({
  block,
  setBlock,
  errors,
  setErrors,
}: FormProps<StatBlockType>) {
  return (
    <FieldGroup>
      <Field>
        <FormHeading
          htmlFor="new-stat-value"
          label="Value"
          required={true}
          validationType={errors.value ? "error" : undefined}
          errorMessage={errors.value}
        />
        <Input
          id="new-stat-value"
          value={block.content.value}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, value: e.target.value },
            });
            if (errors.value) {
              const { value: _value, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="e.g., 25+"
          maxLength={50}
          className={errors.value ? "border-destructive" : ""}
          autoFocus
        />
        <p className="text-xs text-muted-foreground mt-1">
          {block.content.value.length}/50 characters
        </p>
      </Field>
      <Field>
        <FormHeading
          htmlFor="new-stat-label"
          label="Label"
          required={true}
          validationType={errors.label ? "error" : undefined}
          errorMessage={errors.label}
        />
        <Input
          id="new-stat-label"
          value={block.content.label}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, label: e.target.value },
            });
            if (errors.label) {
              const { label: _label, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="e.g., Years of Experience"
          maxLength={50}
          className={errors.label ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {block.content.label.length}/50 characters
        </p>
      </Field>
      <Field>
        <FormHeading htmlFor="new-stat-emoji" label="Emoji" required={false} />
        <Input
          id="new-stat-emoji"
          value={block.content.emoji || ""}
          onChange={(e) => {
            setBlock({
              ...block,
              content: {
                ...block.content,
                emoji: e.target.value || undefined,
              },
            });
          }}
          placeholder="e.g., 📅 🌍 ☕"
          maxLength={10}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional emoji to display instead of auto-selected icon.
        </p>
      </Field>
    </FieldGroup>
  );
}

function PullQuoteForm({
  block,
  setBlock,
  errors,
  setErrors,
}: FormProps<PullQuoteBlockType>) {
  return (
    <FieldGroup>
      <Field>
        <FormHeading
          htmlFor="new-quote-text"
          label="Quote Text"
          required={true}
          validationType={errors.text ? "error" : undefined}
          errorMessage={errors.text}
        />
        <Textarea
          id="new-quote-text"
          value={block.content.text}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, text: e.target.value },
            });
            if (errors.text) {
              const { text: _text, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="Enter an inspiring quote..."
          rows={4}
          maxLength={500}
          className={errors.text ? "border-destructive" : ""}
          autoFocus
        />
        <p className="text-xs text-muted-foreground mt-1">
          {block.content.text.length}/500 characters
        </p>
      </Field>
      <Field>
        <FormHeading htmlFor="new-quote-author" label="Author" />
        <Input
          id="new-quote-author"
          value={block.content.author || ""}
          onChange={(e) => {
            setBlock({
              ...block,
              content: {
                ...block.content,
                author: e.target.value || undefined,
              },
            });
          }}
          placeholder="e.g., John Doe, Founder"
          maxLength={100}
        />
      </Field>
    </FieldGroup>
  );
}

function RichTextForm({
  block,
  setBlock,
  errors,
  setErrors,
}: FormProps<RichTextBlockType>) {
  return (
    <FieldGroup>
      <Field>
        <FormHeading
          htmlFor="new-richtext-content"
          label="Content"
          required={true}
          validationType={errors.html ? "error" : undefined}
          errorMessage={errors.html}
        />
        <RichTextEditor
          content={block.content.html}
          onChange={(html) => {
            setBlock({
              ...block,
              content: { html },
            });
            if (errors.html) {
              const { html: _, ...rest } = errors;
              setErrors(rest);
            }
          }}
        />
      </Field>
    </FieldGroup>
  );
}

function HeroForm({
  block,
  setBlock,
  errors,
  setErrors,
}: FormProps<HeroBlockType>) {
  return (
    <FieldGroup>
      <Field>
        <FormHeading htmlFor="new-hero-heading" label="Heading" />
        <Input
          id="new-hero-heading"
          value={block.content.heading || ""}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, heading: e.target.value },
            });
          }}
          placeholder="e.g., Welcome to Our Story (optional)"
          maxLength={100}
          autoFocus
        />
      </Field>
      <Field>
        <FormHeading
          htmlFor="new-hero-imageUrl"
          label="Image URL"
          required={true}
          validationType={errors.imageUrl ? "error" : undefined}
          errorMessage={errors.imageUrl}
        />
        <Input
          id="new-hero-imageUrl"
          value={block.content.imageUrl}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, imageUrl: e.target.value },
            });
            if (errors.imageUrl) {
              const { imageUrl: _imageUrl, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="/images/hero.jpg"
          className={errors.imageUrl ? "border-destructive" : ""}
        />
      </Field>
      <Field>
        <FormHeading htmlFor="new-hero-caption" label="Caption" />
        <Input
          id="new-hero-caption"
          value={block.content.caption || ""}
          onChange={(e) => {
            setBlock({
              ...block,
              content: {
                ...block.content,
                caption: e.target.value || undefined,
              },
            });
          }}
          placeholder="Optional caption for the image"
          maxLength={500}
        />
      </Field>
    </FieldGroup>
  );
}

function FaqItemForm({
  block,
  setBlock,
  errors,
  setErrors,
}: FormProps<FaqItemBlockType>) {
  return (
    <FieldGroup>
      <Field>
        <FormHeading
          htmlFor="new-faq-question"
          label="Question"
          required={true}
          validationType={errors.question ? "error" : undefined}
          errorMessage={errors.question}
        />
        <Input
          id="new-faq-question"
          value={block.content.question}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, question: e.target.value },
            });
            if (errors.question) {
              const { question: _question, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="What is the question?"
          maxLength={500}
          className={errors.question ? "border-destructive" : ""}
          autoFocus
        />
      </Field>
      <Field>
        <FormHeading
          htmlFor="new-faq-answer"
          label="Answer"
          required={true}
          validationType={errors.answer ? "error" : undefined}
          errorMessage={errors.answer}
        />
        <Textarea
          id="new-faq-answer"
          value={block.content.answer}
          onChange={(e) => {
            setBlock({
              ...block,
              content: { ...block.content, answer: e.target.value },
            });
            if (errors.answer) {
              const { answer: _answer, ...rest } = errors;
              setErrors(rest);
            }
          }}
          placeholder="Provide the answer..."
          rows={4}
          maxLength={2000}
          className={errors.answer ? "border-destructive" : ""}
        />
      </Field>
      <Field>
        <FormHeading
          htmlFor="new-faq-category"
          label="Category"
          required={true}
        />
        <Select
          value={block.content.category || "general"}
          onValueChange={(value) => {
            setBlock({
              ...block,
              content: {
                ...block.content,
                category: value as typeof block.content.category,
              },
            });
          }}
        >
          <SelectTrigger id="new-faq-category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {FAQ_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Group this FAQ under a category for easier navigation
        </p>
      </Field>
    </FieldGroup>
  );
}
