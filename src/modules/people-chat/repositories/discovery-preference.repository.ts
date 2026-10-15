import DiscoveryPreference, {
  normalizeDiscoveryUserId,
} from "@/modules/people-chat/models/discovery-preference.model";
import type {
  DiscoveryCandidateRecord,
  DiscoveryPreferenceInput,
  DiscoveryPreferenceRecord,
} from "@/modules/people-chat/types/discovery";

const PREFERENCE_FIELDS = "_id userId enabled interests createdAt updatedAt";

export async function findDiscoveryPreferenceByUserId(userId: string) {
  return DiscoveryPreference.findOne({ userId: normalizeDiscoveryUserId(userId) })
    .select(PREFERENCE_FIELDS)
    .lean()
    .exec() as unknown as Promise<DiscoveryPreferenceRecord | null>;
}

export async function updateDiscoveryPreferenceForUser(
  userId: string,
  preference: DiscoveryPreferenceInput & { interests: Array<{ name: string; normalizedName: string; visible: boolean }> }
) {
  const filter = { userId: normalizeDiscoveryUserId(userId) };
  const update = { $set: { enabled: preference.enabled, interests: preference.interests } };
  try {
    return await DiscoveryPreference.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    })
      .select(PREFERENCE_FIELDS)
      .lean()
      .exec() as unknown as DiscoveryPreferenceRecord;
  } catch (error) {
    if ((error as { code?: unknown })?.code !== 11000) throw error;
    const updated = await DiscoveryPreference.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    })
      .select(PREFERENCE_FIELDS)
      .lean()
      .exec();
    if (!updated) throw error;
    return updated as unknown as DiscoveryPreferenceRecord;
  }
}

export async function findEnabledDiscoveryCandidates(
  userId: string,
  normalizedInterestNames: string[],
  limit: number
) {
  if (!normalizedInterestNames.length || limit <= 0) return [];
  return DiscoveryPreference.find({
    userId: { $ne: normalizeDiscoveryUserId(userId) },
    enabled: true,
    interests: {
      $elemMatch: {
        visible: true,
        normalizedName: { $in: normalizedInterestNames },
      },
    },
  })
    .select("userId enabled interests.name interests.normalizedName interests.visible")
    .sort({ userId: 1 })
    .limit(limit)
    .lean()
    .exec() as unknown as Promise<DiscoveryCandidateRecord[]>;
}
