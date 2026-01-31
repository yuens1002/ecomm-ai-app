import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const pathMappings = [
  // Lib paths
  ['@/lib/admin-nav-config', '@/lib/config/admin-nav'],
  ['@/lib/app-settings', '@/lib/config/app-settings'],
  ['@/lib/stripe', '@/lib/services/stripe'],
  ['@/lib/resend', '@/lib/services/resend'],

  // Hooks
  ['@/hooks/useSiteBanner', '@/app/(site)/_hooks/useSiteBanner'],
  ['@/hooks/use-vapi', '@/app/(site)/_hooks/use-vapi'],
  ['@/hooks/useImageUpload', '@/app/admin/_hooks/useImageUpload'],
  ['@/hooks/useSlugGenerator', '@/app/admin/_hooks/useSlugGenerator'],

  // Blocks
  ['@/components/blocks', '@/app/admin/_components/cms/blocks'],

  // Admin dashboard
  ['@/components/admin/dashboard', '@/app/admin/_components/dashboard'],

  // Admin form components
  ['@/components/admin/form-heading', '@/app/admin/_components/forms/form-heading'],
  ['@/components/admin/OptionCardGroup', '@/app/admin/_components/forms/OptionCardGroup'],
  ['@/components/admin/OptionCardGroupWithSave', '@/app/admin/_components/forms/OptionCardGroupWithSave'],
  ['@/components/admin/PageTitle', '@/app/admin/_components/forms/PageTitle'],
  ['@/components/admin/SaveButton', '@/app/admin/_components/forms/SaveButton'],
  ['@/components/admin/SettingsField', '@/app/admin/_components/forms/SettingsField'],
  ['@/components/admin/SettingsSection', '@/app/admin/_components/forms/SettingsSection'],

  // Admin shared
  ['@/components/admin/UpdateBanner', '@/app/admin/_components/shared/UpdateBanner'],
  ['@/components/admin/FeedbackDialog', '@/app/admin/_components/shared/FeedbackDialog'],

  // Site layout (both @/ and @components variants)
  ['@/components/app-components/SiteHeader', '@/app/(site)/_components/layout/SiteHeader'],
  ['@components/app-components/SiteHeader', '@/app/(site)/_components/layout/SiteHeader'],
  ['@/components/app-components/SiteHeaderWrapper', '@/app/(site)/_components/layout/SiteHeaderWrapper'],
  ['@components/app-components/SiteHeaderWrapper', '@/app/(site)/_components/layout/SiteHeaderWrapper'],
  ['@/components/app-components/SiteFooter', '@/app/(site)/_components/layout/SiteFooter'],
  ['@components/app-components/SiteFooter', '@/app/(site)/_components/layout/SiteFooter'],
  ['@/components/app-components/SiteBanner', '@/app/(site)/_components/layout/SiteBanner'],
  ['@components/app-components/SiteBanner', '@/app/(site)/_components/layout/SiteBanner'],
  ['@/components/app-components/SiteBannerPortal', '@/app/(site)/_components/layout/SiteBannerPortal'],
  ['@components/app-components/SiteBannerPortal', '@/app/(site)/_components/layout/SiteBannerPortal'],
  ['@/components/app-components/SiteLayoutClient', '@/app/(site)/_components/layout/SiteLayoutClient'],
  ['@components/app-components/SiteLayoutClient', '@/app/(site)/_components/layout/SiteLayoutClient'],

  // Site navigation
  ['@/components/app-components/CategoryMenuColumns', '@/app/(site)/_components/navigation/CategoryMenuColumns'],
  ['@components/app-components/CategoryMenuColumns', '@/app/(site)/_components/navigation/CategoryMenuColumns'],
  ['@/components/app-components/FooterCategories', '@/app/(site)/_components/navigation/FooterCategories'],
  ['@components/app-components/FooterCategories', '@/app/(site)/_components/navigation/FooterCategories'],
  ['@/components/app-components/FooterAccountLinks', '@/app/(site)/_components/navigation/FooterAccountLinks'],
  ['@components/app-components/FooterAccountLinks', '@/app/(site)/_components/navigation/FooterAccountLinks'],
  ['@/components/app-components/UserMenu', '@/app/(site)/_components/navigation/UserMenu'],
  ['@components/app-components/UserMenu', '@/app/(site)/_components/navigation/UserMenu'],

  // Site product
  ['@/components/app-components/ProductCard', '@/app/(site)/_components/product/ProductCard'],
  ['@components/app-components/ProductCard', '@/app/(site)/_components/product/ProductCard'],
  ['@/components/app-components/FeaturedProducts', '@/app/(site)/_components/product/FeaturedProducts'],
  ['@components/app-components/FeaturedProducts', '@/app/(site)/_components/product/FeaturedProducts'],
  ['@/components/app-components/RecommendationsSection', '@/app/(site)/_components/product/RecommendationsSection'],
  ['@components/app-components/RecommendationsSection', '@/app/(site)/_components/product/RecommendationsSection'],
  ['@/components/product/', '@/app/(site)/_components/product/'],
  ['@components/product/', '@/app/(site)/_components/product/'],

  // Site cart
  ['@/components/app-components/ShoppingCart', '@/app/(site)/_components/cart/ShoppingCart'],
  ['@components/app-components/ShoppingCart', '@/app/(site)/_components/cart/ShoppingCart'],
  ['@/components/app-components/CartAddOnsSuggestions', '@/app/(site)/_components/cart/CartAddOnsSuggestions'],
  ['@components/app-components/CartAddOnsSuggestions', '@/app/(site)/_components/cart/CartAddOnsSuggestions'],
  ['@/components/app-components/AddOnCard', '@/app/(site)/_components/cart/AddOnCard'],
  ['@components/app-components/AddOnCard', '@/app/(site)/_components/cart/AddOnCard'],

  // Site AI
  ['@/components/app-components/ChatBarista', '@/app/(site)/_components/ai/ChatBarista'],
  ['@components/app-components/ChatBarista', '@/app/(site)/_components/ai/ChatBarista'],
  ['@/components/app-components/VoiceBarista', '@/app/(site)/_components/ai/VoiceBarista'],
  ['@components/app-components/VoiceBarista', '@/app/(site)/_components/ai/VoiceBarista'],
  ['@/components/app-components/AiHelperModal', '@/app/(site)/_components/ai/AiHelperModal'],
  ['@components/app-components/AiHelperModal', '@/app/(site)/_components/ai/AiHelperModal'],

  // Site content
  ['@/components/app-components/Hero', '@/app/(site)/_components/content/Hero'],
  ['@components/app-components/Hero', '@/app/(site)/_components/content/Hero'],
  ['@/components/app-components/HeroSection', '@/app/(site)/_components/content/HeroSection'],
  ['@components/app-components/HeroSection', '@/app/(site)/_components/content/HeroSection'],
  ['@/components/app-components/HoursCard', '@/app/(site)/_components/content/HoursCard'],
  ['@components/app-components/HoursCard', '@/app/(site)/_components/content/HoursCard'],
  ['@/components/app-components/PullQuote', '@/app/(site)/_components/content/PullQuote'],
  ['@components/app-components/PullQuote', '@/app/(site)/_components/content/PullQuote'],
  ['@/components/app-components/StatCard', '@/app/(site)/_components/content/StatCard'],
  ['@components/app-components/StatCard', '@/app/(site)/_components/content/StatCard'],
  ['@/components/app-components/FaqAccordionItem', '@/app/(site)/_components/content/FaqAccordionItem'],
  ['@components/app-components/FaqAccordionItem', '@/app/(site)/_components/content/FaqAccordionItem'],
  ['@/components/app-components/FaqPageContent', '@/app/(site)/_components/content/FaqPageContent'],
  ['@components/app-components/FaqPageContent', '@/app/(site)/_components/content/FaqPageContent'],
  ['@/components/app-components/NewsletterSignup', '@/app/(site)/_components/content/NewsletterSignup'],
  ['@components/app-components/NewsletterSignup', '@/app/(site)/_components/content/NewsletterSignup'],
  ['@/components/app-components/ImageCard', '@/app/(site)/_components/content/ImageCard'],
  ['@components/app-components/ImageCard', '@/app/(site)/_components/content/ImageCard'],
  ['@/components/app-components/SocialLinks', '@/app/(site)/_components/content/SocialLinks'],
  ['@components/app-components/SocialLinks', '@/app/(site)/_components/content/SocialLinks'],
  ['@/components/app-components/DemoBanner', '@/app/(site)/_components/content/DemoBanner'],
  ['@components/app-components/DemoBanner', '@/app/(site)/_components/content/DemoBanner'],
  ['@/components/app-components/PreviewBannerSetter', '@/app/(site)/_components/content/PreviewBannerSetter'],
  ['@components/app-components/PreviewBannerSetter', '@/app/(site)/_components/content/PreviewBannerSetter'],

  // Site category
  ['@/components/app-components/CategoryClientPage', '@/app/(site)/_components/category/CategoryClientPage'],
  ['@components/app-components/CategoryClientPage', '@/app/(site)/_components/category/CategoryClientPage'],

  // Site account
  ['@/components/app-components/OrdersClient', '@/app/(site)/_components/account/OrdersClient'],
  ['@components/app-components/OrdersClient', '@/app/(site)/_components/account/OrdersClient'],

  // Admin CMS editors
  ['@/components/app-components/PageEditor', '@/app/admin/_components/cms/editors/PageEditor'],
  ['@components/app-components/PageEditor', '@/app/admin/_components/cms/editors/PageEditor'],
  ['@/components/app-components/RichTextEditor', '@/app/admin/_components/cms/editors/RichTextEditor'],
  ['@components/app-components/RichTextEditor', '@/app/admin/_components/cms/editors/RichTextEditor'],
  ['@/components/app-components/TipTapEditor', '@/app/admin/_components/cms/editors/TipTapEditor'],
  ['@components/app-components/TipTapEditor', '@/app/admin/_components/cms/editors/TipTapEditor'],
  ['@/components/app-components/AboutAnswerEditor', '@/app/admin/_components/cms/editors/AboutAnswerEditor'],
  ['@components/app-components/AboutAnswerEditor', '@/app/admin/_components/cms/editors/AboutAnswerEditor'],

  // Admin CMS fields
  ['@/components/app-components/ImageField', '@/app/admin/_components/cms/fields/ImageField'],
  ['@components/app-components/ImageField', '@/app/admin/_components/cms/fields/ImageField'],
  ['@/components/app-components/ImageListField', '@/app/admin/_components/cms/fields/ImageListField'],
  ['@components/app-components/ImageListField', '@/app/admin/_components/cms/fields/ImageListField'],
  ['@/components/app-components/FileUpload', '@/app/admin/_components/cms/fields/FileUpload'],
  ['@components/app-components/FileUpload', '@/app/admin/_components/cms/fields/FileUpload'],
  ['@/components/app-components/IconPicker', '@/app/admin/_components/cms/fields/IconPicker'],
  ['@components/app-components/IconPicker', '@/app/admin/_components/cms/fields/IconPicker'],
  ['@/components/app-components/NameSlugField', '@/app/admin/_components/cms/fields/NameSlugField'],
  ['@components/app-components/NameSlugField', '@/app/admin/_components/cms/fields/NameSlugField'],
  ['@/components/app-components/PendingImageUpload', '@/app/admin/_components/cms/fields/PendingImageUpload'],
  ['@components/app-components/PendingImageUpload', '@/app/admin/_components/cms/fields/PendingImageUpload'],

  // Admin dialogs
  ['@/components/app-components/DialogShell', '@/app/admin/_components/dialogs/DialogShell'],
  ['@components/app-components/DialogShell', '@/app/admin/_components/dialogs/DialogShell'],
  ['@/components/app-components/AiAssistDialog', '@/app/admin/_components/dialogs/AiAssistDialog'],
  ['@components/app-components/AiAssistDialog', '@/app/admin/_components/dialogs/AiAssistDialog'],
  ['@/components/app-components/BlockEditDialog', '@/app/admin/_components/dialogs/BlockEditDialog'],
  ['@components/app-components/BlockEditDialog', '@/app/admin/_components/dialogs/BlockEditDialog'],

  // Shared media
  ['@/components/app-components/ImageCarousel', '@/components/shared/media/ImageCarousel'],
  ['@components/app-components/ImageCarousel', '@/components/shared/media/ImageCarousel'],
  ['@/components/app-components/ScrollCarousel', '@/components/shared/media/ScrollCarousel'],
  ['@components/app-components/ScrollCarousel', '@/components/shared/media/ScrollCarousel'],
  ['@/components/app-components/CarouselDots', '@/components/shared/media/CarouselDots'],
  ['@components/app-components/CarouselDots', '@/components/shared/media/CarouselDots'],

  // Shared icons
  ['@/components/app-components/DynamicIcon', '@/components/shared/icons/DynamicIcon'],
  ['@components/app-components/DynamicIcon', '@/components/shared/icons/DynamicIcon'],

  // Auth
  ['@/components/app-components/auth/', '@/components/auth/'],
  ['@components/app-components/auth/', '@/components/auth/'],

  // Providers
  ['@/components/app-components/SessionProvider', '@/components/providers/SessionProvider'],
  ['@components/app-components/SessionProvider', '@/components/providers/SessionProvider'],
  ['@/components/app-components/ThemeProvider', '@/components/providers/ThemeProvider'],
  ['@components/app-components/ThemeProvider', '@/components/providers/ThemeProvider'],

  // Shared utilities
  ['@/components/app-components/ThemeSwitcher', '@/components/shared/ThemeSwitcher'],
  ['@components/app-components/ThemeSwitcher', '@/components/shared/ThemeSwitcher'],
  ['@/components/app-components/EnvironmentIndicator', '@/components/shared/EnvironmentIndicator'],
  ['@components/app-components/EnvironmentIndicator', '@/components/shared/EnvironmentIndicator'],
  ['@/components/app-components/PageContainer', '@/components/shared/PageContainer'],
  ['@components/app-components/PageContainer', '@/components/shared/PageContainer'],
];

function walkDir(dir, callback) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filepath = join(dir, file);
    const stat = statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filepath, callback);
      }
    } else {
      callback(filepath);
    }
  }
}

function processFile(filepath) {
  const ext = extname(filepath);
  if (ext !== '.ts' && ext !== '.tsx') return;

  let content = readFileSync(filepath, 'utf8');
  const originalContent = content;

  for (const [oldPath, newPath] of pathMappings) {
    content = content.split(oldPath).join(newPath);
  }

  if (content !== originalContent) {
    writeFileSync(filepath, content, 'utf8');
    console.log('Updated:', filepath);
  }
}

console.log('Updating imports...');
walkDir('.', processFile);
console.log('Done!');
