import { findPeopleByIds } from "@/modules/people-chat/repositories/people.repository";
import {
  findDiscoveryPreferenceByUserId,
  findEnabledDiscoveryCandidates,
  updateDiscoveryPreferenceForUser,
} from "@/modules/people-chat/repositories/discovery-preference.repository";
import { normalizeInterestLabel, normalizeInterestName } from "@/modules/people-chat/normalization/discovery-interest";
import type {
  DiscoveryCandidateDto,
  DiscoveryPreferenceDto,
  DiscoveryPreferenceInput,
} from "@/modules/people-chat/types/discovery";

const MAX_DISCOVERY_CANDIDATES = 100;
// Deterministic bounded result set; pagination is outside this backend phase.

type StoredPreference = {
  userId?: unknown;
  enabled?: unknown;
  interests?: unknown;
};

function readSafePreferences(value: StoredPreference | null | undefined): DiscoveryPreferenceDto | null {
  if (!value || typeof value.enabled !== "boolean" || !Array.isArray(value.interests) || value.interests.length > 20) {
    return null;
  }

  const interests: DiscoveryPreferenceDto["interests"] = [];
  const names = new Set<string>();
  for (const candidate of value.interests) {
    if (!candidate || typeof candidate !== "object") return null;
    const interest = candidate as Record<string, unknown>;
    if (typeof interest.name !== "string" || typeof interest.normalizedName !== "string" || typeof interest.visible !== "boolean") {
      return null;
    }
    const name = normalizeInterestLabel(interest.name);
    const normalizedName = normalizeInterestName(name);
    if (!name || name.length > 80 || normalizedName !== interest.normalizedName || names.has(normalizedName)) {
      return null;
    }
    names.add(normalizedName);
    interests.push({ name, visible: interest.visible });
  }

  return { enabled: value.enabled, interests };
}

function normalizeUserId(value: unknown): string | null {
  const userId = typeof value === "string"
    ? value
    : value && typeof (value as { toString?: unknown }).toString === "function"
      ? (value as { toString(): string }).toString()
      : "";
  return /^[a-f\d]{24}$/i.test(userId) ? userId.toLowerCase() : null;
}

const DEFAULT_PREFERENCES: DiscoveryPreferenceDto = { enabled: false, interests: [] };

export async function getDiscoveryPreferences(userId: string): Promise<DiscoveryPreferenceDto> {
  const preference = await findDiscoveryPreferenceByUserId(userId);
  return readSafePreferences(preference) ?? DEFAULT_PREFERENCES;
}

export async function saveDiscoveryPreferences(
  userId: string,
  input: DiscoveryPreferenceInput
): Promise<DiscoveryPreferenceDto> {
  const interests = input.interests.map(({ name, visible }) => {
    const label = normalizeInterestLabel(name);
    return { name: label, normalizedName: normalizeInterestName(label), visible };
  });
  const saved = await updateDiscoveryPreferenceForUser(userId, {
    enabled: input.enabled,
    interests,
  });
  return readSafePreferences(saved) ?? DEFAULT_PREFERENCES;
}

export async function discoverPeople(userId: string): Promise<DiscoveryCandidateDto[]> {
  const preference = await findDiscoveryPreferenceByUserId(userId);
  const current = readSafePreferences(preference);
  if (!current?.enabled) return [];

  const ownVisible = new Map(
    current.interests
      .filter((interest) => interest.visible)
      .map((interest) => [normalizeInterestName(interest.name), interest.name])
  );
  if (!ownVisible.size) return [];

  const candidatePreferences = await findEnabledDiscoveryCandidates(
    userId,
    [...ownVisible.keys()],
    MAX_DISCOVERY_CANDIDATES
  );
  const sharedByUserId = new Map<string, string[]>();
  for (const candidate of candidatePreferences) {
    const candidatePrefs = readSafePreferences(candidate);
    if (!candidatePrefs?.enabled) continue;
    const candidateUserId = normalizeUserId(candidate.userId);
    if (!candidateUserId || candidateUserId === userId.toLowerCase()) continue;
    const matches = new Set<string>();
    for (const interest of candidatePrefs.interests) {
      const normalizedName = normalizeInterestName(interest.name);
      if (interest.visible && ownVisible.has(normalizedName)) matches.add(normalizedName);
    }
    if (matches.size) {
      sharedByUserId.set(
        candidateUserId,
        [...ownVisible.entries()]
          .filter(([normalizedName]) => matches.has(normalizedName))
          .map(([, displayName]) => displayName)
      );
    }
  }

  const candidateIds = [...sharedByUserId.keys()];
  const profiles = candidateIds.length ? await findPeopleByIds(candidateIds) : [];
  const displayNames = new Map(
    profiles.map((profile) => [profile._id.toString(), profile.fullname])
  );

  return candidateIds.flatMap((candidateUserId) => {
    const displayName = displayNames.get(candidateUserId);
    const sharedInterests = sharedByUserId.get(candidateUserId);
    if (!displayName || !sharedInterests?.length) return [];
    return [{ userId: candidateUserId, displayName, sharedInterests }];
  });
}
