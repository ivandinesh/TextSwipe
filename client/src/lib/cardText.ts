export type CardTextSizeTier = "short" | "medium" | "long" | "xlong";

export const CARD_TEXT_TIER_LIMITS = {
  shortMax: 140,
  mediumMax: 240,
  longMax: 320,
  xlongMax: 380,
} as const;

export function getCardTextSizeTier(content: string): CardTextSizeTier {
  const length = content.trim().length;

  if (length <= CARD_TEXT_TIER_LIMITS.shortMax) {
    return "short";
  }

  if (length <= CARD_TEXT_TIER_LIMITS.mediumMax) {
    return "medium";
  }

  if (length <= CARD_TEXT_TIER_LIMITS.longMax) {
    return "long";
  }

  return "xlong";
}
