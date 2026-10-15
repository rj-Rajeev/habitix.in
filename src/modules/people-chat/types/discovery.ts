import type { Types } from "mongoose";

export interface DiscoveryInterest {
  name: string;
  normalizedName: string;
  visible: boolean;
}

export interface DiscoveryPreferenceRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  enabled: boolean;
  interests: DiscoveryInterest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveryPreferenceInput {
  enabled: boolean;
  interests: Array<{ name: string; visible: boolean }>;
}

export interface DiscoveryPreferenceDto {
  enabled: boolean;
  interests: Array<{ name: string; visible: boolean }>;
}

export interface DiscoveryCandidateRecord {
  userId: Types.ObjectId;
  enabled: boolean;
  interests: DiscoveryInterest[];
}

export interface DiscoveryCandidateDto {
  userId: string;
  displayName: string;
  sharedInterests: string[];
}
