-- Add database-level default for unsubscribeToken using gen_random_uuid()
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" SET DEFAULT gen_random_uuid()::text;
