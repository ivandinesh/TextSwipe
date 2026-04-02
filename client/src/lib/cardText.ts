export type CardTextSizeTier = "short" | "medium" | "long" | "xlong";

export const CARD_TEXT_TIER_LIMITS = {
  shortMax: 140,
  mediumMax: 240,
  longMax: 320,
  xlongMax: 380,
} as const;

export function getCardTextSizeTier(content: string): CardTextSizeTier {
  const trimmed = content.trim();
  const length = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);
  const punctuationBreaks = (trimmed.match(/[.,;:!?]/g) ?? []).length;
  const likelyMultiLineRisk =
    wordCount >= 12 ||
    longestWordLength >= 11 ||
    (wordCount >= 9 && punctuationBreaks <= 1);

  if (length <= CARD_TEXT_TIER_LIMITS.shortMax && !likelyMultiLineRisk) {
    return "short";
  }

  if (length <= CARD_TEXT_TIER_LIMITS.mediumMax && !(likelyMultiLineRisk && wordCount >= 18)) {
    return "medium";
  }

  if (length <= CARD_TEXT_TIER_LIMITS.longMax) {
    return "long";
  }

  return "xlong";
}
