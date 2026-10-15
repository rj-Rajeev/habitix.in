import mongoose, { Schema, Types } from "mongoose";
import type { DiscoveryPreferenceRecord } from "@/modules/people-chat/types/discovery";

const DiscoveryInterestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    normalizedName: { type: String, required: true, maxlength: 240 },
    visible: { type: Boolean, required: true },
  },
  { _id: false }
);

const DiscoveryPreferenceSchema = new Schema<DiscoveryPreferenceRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    interests: {
      type: [DiscoveryInterestSchema],
      default: [],
      validate: {
        validator: (interests: unknown[]) => Array.isArray(interests) && interests.length <= 20,
        message: "A maximum of 20 learning interests is allowed",
      },
    },
  },
  { timestamps: true }
);

DiscoveryPreferenceSchema.index(
  { userId: 1 },
  { unique: true, name: "unique_discovery_preference_user" }
);
DiscoveryPreferenceSchema.index(
  { enabled: 1, "interests.visible": 1, "interests.normalizedName": 1, userId: 1 },
  { name: "discovery_enabled_visible_interest" }
);

export function normalizeDiscoveryUserId(userId: string): Types.ObjectId {
  if (!/^[a-f\d]{24}$/i.test(userId) || !Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid discovery user ID");
  }
  return new Types.ObjectId(userId);
}

const DiscoveryPreference =
  mongoose.models.DiscoveryPreference ||
  mongoose.model<DiscoveryPreferenceRecord>("DiscoveryPreference", DiscoveryPreferenceSchema);

export default DiscoveryPreference;
