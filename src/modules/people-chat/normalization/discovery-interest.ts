export function normalizeInterestLabel(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function normalizeInterestName(value: string): string {
  return normalizeInterestLabel(value).toLowerCase();
}
