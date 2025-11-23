-- Add footer contact settings to SiteSettings table

-- Shop hours visibility and value
INSERT INTO "SiteSettings" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid(), 'footer_show_hours', 'true', NOW())
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "SiteSettings" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid(), 'footer_hours_text', 'Mon-Fri 7am-7pm', NOW())
ON CONFLICT ("key") DO NOTHING;

-- Email visibility and value
INSERT INTO "SiteSettings" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid(), 'footer_show_email', 'true', NOW())
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "SiteSettings" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid(), 'footer_email', 'hello@artisan-roast.com', NOW())
ON CONFLICT ("key") DO NOTHING;
