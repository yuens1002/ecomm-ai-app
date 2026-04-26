-- Search drawer v2: chips are now driven by a CategoryLabel (admin picks
-- a label; its categories become the chips), not a free-text heading +
-- multi-select array. New key `search_drawer_chip_label` is seeded by
-- prisma/seed/settings.ts. Schema unchanged (SiteSettings is generic key-value).
DELETE FROM "SiteSettings"
WHERE "key" IN (
  'search_drawer_chips_heading',
  'search_drawer_chip_categories'
);
