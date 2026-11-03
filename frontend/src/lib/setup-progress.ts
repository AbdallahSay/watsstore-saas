import { DashboardSummary } from "@/types";
import { CommerceSettings } from "./commerce-api";
export const SETUP_STEPS = [
  "information",
  "branding",
  "product",
  "fulfillment",
  "design",
  "publish",
] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];
/** Evidence comes from authenticated server data. A default theme is not proof of publishing. */
export function setupProgress(
  summary: DashboardSummary,
  settings: CommerceSettings,
) {
  const s = summary.storeInfo;
  return [
    !!(
      s.storeName.trim() &&
      s.city.trim() &&
      s.businessCategory.trim() &&
      s.whatsAppNumber
    ),
    !!s.logoUrl,
    summary.totalProducts > 0,
    !!(
      settings.cashOnDelivery ||
      (settings.instaPay && s.instaPayAddress) ||
      (settings.mobileWallet && s.vodafoneCashNumber)
    ),
    !!settings.draftTheme,
    !!settings.publishedAt,
  ];
}
export function setupStorageKey(storeId: string) {
  return `ws_setup_step_v1_${storeId}`;
}
export function restoredSetupStep(value: string | null): number {
  return /^\d$/.test(value || "") ? Math.min(5, Number(value)) : 0;
}
export function storeSettingsPayload(s: DashboardSummary["storeInfo"]) {
  return {
    storeName: s.storeName,
    whatsAppNumber: s.whatsAppNumber,
    businessCategory: s.businessCategory,
    city: s.city,
    addressDetails: s.addressDetails || "",
    logoUrl: s.logoUrl || "",
    coverUrl: s.coverUrl || "",
    themeColor: s.themeColor,
    currency: s.currency,
    deliveryFee: s.deliveryFee,
    seoTitle: s.seoTitle || "",
    seoDescription: s.seoDescription || "",
    metaPixelId: s.metaPixelId || "",
    vodafoneCashNumber: s.vodafoneCashNumber || "",
    instaPayAddress: s.instaPayAddress || "",
  };
}
