/**
 * Curated placeholder images using Unsplash
 *
 * Uses lookup tables to guarantee unique image assignment per product.
 * All images are free to use under the Unsplash License.
 */

/**
 * Coffee product name -> specific photo ID mapping
 * Ensures each coffee product gets a unique image
 */
const COFFEE_PRODUCT_IMAGES: Record<string, string> = {
  // Hand-curated from Unsplash collections - verified raw coffee beans only
  "Midnight Espresso Blend": "photo-1541916194682-cbf2a0371d3d",  // AF4y8fsQkYQ
  "Italian Roast": "photo-1520516472218-ed48f8ff3271",            // cbdPqbvNkJ8
  "Sumatra Mandheling": "photo-1475333154578-0538252118ad",       // XpyD7z6AP4g
  "French Roast": "photo-1525445842399-d8a6bec24be2",             // 68KjM0kfsVo
  "Papua New Guinea Sigri Estate": "photo-1504538292323-20e79775474d", // QLkjP_W4d7c
  "Decaf Colombian": "photo-1515471897120-85416077e011",          // PX1IrPsimHE
  "Breakfast Blend": "photo-1555526533-25d5a4058d82",             // Bj8Fu4xfaQE
  "Colombian Supremo": "photo-1527619675211-f7283b39fae4",        // dMl65P1Rgs4
  "Guatemalan Antigua": "photo-1555118076-8248a6da45d6",          // ks5vYUoefhw
  "Costa Rica Tarrazú": "photo-1518164483967-d6d558aa44df",       // P2X_zf9o094
  "Brazil Santos": "photo-1524350876685-274059332603",            // obV_LM0KjxY
  "Honduras Marcala": "photo-1490890870453-549b7f8d3bb5",         // DMpYt_kfqL4
  "Mexican Altura": "photo-1587734195503-904fca47e0e9",           // lGl3spVIU0g
  "Peruvian Organic": "photo-1630595478874-eefd5083f210",         // 3pgSRBU-uKk
  "Nicaraguan SHG": "photo-1501492673258-2bcfc17241fd",           // 9rmnzkmydSY
  "El Salvador Pacamara": "photo-1594934103593-d2615ce26ae2",     // XWQ15ixxRjE
  "Ethiopian Yirgacheffe": "photo-1523247452367-d68f888d4b80",    // lgS6EZq1HGU
  "Kenya AA": "photo-1522273777983-a0d924529b83",                 // MSlZyJwYJlw
  "Ethiopian Sidamo": "photo-1587403206457-be9f1e357e55",         // 9GnJ6YnkHp4
  "Rwanda Bourbon": "photo-1770081485131-d978211245aa",           // 1F7dL8tLHKs
  "Burundi Kayanza": "photo-1612487458970-564127ec86f5",          // PDipEilB0b8
  "Tanzania Peaberry": "photo-1690983324515-d0faf73de6ca",        // kfnLPPR0FzI
  "Panama Geisha": "photo-1605116188332-c83cf910031c",            // VylPA_mm7AE
  "Colombia Geisha": "photo-1602486742905-7c2fedd026ea",          // 0TSguCjilJQ
  "Costa Rica Honey Process": "photo-1561480337-6645d95535b9",    // 3q3f1uDQk94
  "Guatemala Huehuetenango": "photo-1611410255266-a1eaa3768021",  // r0Y7IHdVsw4
  "Bolivia Caranavi": "photo-1671363927071-e0c24ed8f2c4",         // 9De7KR3irTg
  "Yemen Mocha": "photo-1611787007489-9a19db1c9d04",              // bUdaT1WLScI
  "India Monsooned Malabar": "photo-1717380046868-3deeab8191eb",  // fUH72rlijH4
  "Hawaiian Kona": "photo-1671038988310-083c9d0942b1",            // 3RHrtBWKt0c
};

/**
 * Merch product name -> specific photo ID mapping
 * Ensures each merch product gets a unique image
 */
const MERCH_PRODUCT_IMAGES: Record<string, string> = {
  "Heritage Diner Mug": "photo-1619970291267-0e61f239c59e",
  "Everyday Camp Tumbler": "photo-1619970291696-81b56c59804b",
  "Cold Brew Bottle": "photo-1619970291284-56d9b4de6472",
  "Origami Air Dripper": "photo-1629991848910-2ab88d9cc52f",
  "Origami Cone Filters (100ct)": "photo-1553578615-ee00f2db2c5c",
  "Fellow Stagg EKG Kettle": "photo-1661761220121-75af77b126a0",
  "Timemore Black Mirror Scale": "photo-1595984288728-7608c67f6e76",
  "Airscape Coffee Canister": "photo-1630783397198-c64d9e87fb65",
  "Cupping Spoon": "photo-1630783397237-3dc5caf9ded9",
  "Roastery Script Tee": "photo-1646802435194-fc68ec690e88",
  "Barista Towel 2-Pack": "photo-1763473821509-9a383b480844",
  "Enamel Pin Set": "photo-1559001724-fbad036dbc9e",
};

/**
 * Fallback photo IDs for products not in lookup tables
 */
const FALLBACK_BEAN_PHOTOS = [
  "photo-1541916194682-cbf2a0371d3d",
  "photo-1520516472218-ed48f8ff3271",
  "photo-1555526533-25d5a4058d82",
  "photo-1524350876685-274059332603",
  "photo-1555118076-8248a6da45d6",
];

const FALLBACK_CULTURE_PHOTOS = [
  "photo-1619970291267-0e61f239c59e",
  "photo-1629991848910-2ab88d9cc52f",
  "photo-1553578615-ee00f2db2c5c",
  "photo-1661761220121-75af77b126a0",
  "photo-1595984288728-7608c67f6e76",
];

/**
 * Cafe interior photo IDs for CMS pages
 */
const CAFE_PHOTO_IDS = [
  "photo-1544457070-4cd773b4d71e",
  "photo-1504963642567-227b3bbd79de",
  "photo-1576666045809-e4587d488518",
  "photo-1667020080976-9dfee090458e",
  "photo-1714328101501-3594de6cb80f",
  "photo-1751076605132-b4172bb8c6a4",
  "photo-1678233517592-657a186396b8",
  "photo-1678233517591-1ca561b9fe45",
  "photo-1521017432531-fbd92d768814",
  "photo-1554118811-1e0d58224f24",
  "photo-1559925393-8be0ec4767c8",
  "photo-1501339847302-ac426a4a7cbb",
  "photo-1445116572660-236099ec97a0",
  "photo-1453614512568-c4024d13c247",
  "photo-1559329007-40df8a9345d8",
];

type ImageCategory = "beans" | "cafe" | "culture";

/**
 * Simple hash function for fallback/banner selection
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Get a consistent placeholder image URL based on a seed string.
 * Uses lookup tables for known products to guarantee uniqueness.
 *
 * @param seed - Product name or identifier
 * @param size - Image size for square crop (default: 800)
 * @param category - "beans" for coffee, "culture" for merch, "cafe" for CMS
 * @returns Unsplash image URL
 */
export function getPlaceholderImage(
  seed: string = "",
  size: number = 800,
  category: ImageCategory = "beans"
): string {
  let photoId: string;

  if (category === "beans") {
    // Check lookup table first
    photoId = COFFEE_PRODUCT_IMAGES[seed];
    if (!photoId) {
      // Fallback for unknown products
      const index = hashString(seed) % FALLBACK_BEAN_PHOTOS.length;
      photoId = FALLBACK_BEAN_PHOTOS[index];
    }
  } else if (category === "culture") {
    // Check lookup table first
    photoId = MERCH_PRODUCT_IMAGES[seed];
    if (!photoId) {
      // Fallback for unknown products
      const index = hashString(seed) % FALLBACK_CULTURE_PHOTOS.length;
      photoId = FALLBACK_CULTURE_PHOTOS[index];
    }
  } else {
    // cafe category - use hash for banners
    const index = hashString(seed) % CAFE_PHOTO_IDS.length;
    photoId = CAFE_PHOTO_IDS[index];
  }

  return `https://images.unsplash.com/${photoId}?w=${size}&h=${size}&fit=crop&crop=entropy`;
}

/**
 * Get a wide/banner placeholder image (for hero sections, headers)
 *
 * @param seed - A string to use for consistent image selection
 * @param width - Image width (default: 1920)
 * @param height - Image height (default: 800)
 * @param category - Image category
 * @returns Unsplash image URL
 */
export function getPlaceholderBanner(
  seed: string = "",
  width: number = 1920,
  height: number = 800,
  _category: ImageCategory = "cafe"
): string {
  // Banners always use cafe images
  const photoIds = CAFE_PHOTO_IDS;
  const index = hashString(seed) % photoIds.length;
  const photoId = photoIds[index];

  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&crop=entropy`;
}

/**
 * Default placeholder for product images (800x800)
 */
export const DEFAULT_PRODUCT_PLACEHOLDER = getPlaceholderImage("default");

/**
 * Default placeholder for add-on/thumbnail images (400x400)
 */
export const DEFAULT_ADDON_PLACEHOLDER = getPlaceholderImage("addon", 400, "culture");

/**
 * Default placeholder for CMS page banners
 */
export const DEFAULT_BANNER_PLACEHOLDER = getPlaceholderBanner("banner");
