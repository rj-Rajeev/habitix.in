import { z } from "zod";
import { normalizeInterestName, normalizeInterestLabel } from "@/modules/people-chat/normalization/discovery-interest";

const discoveryInterestSchema = z
  .object({
    name: z.string().max(80, "Interest names must be 80 characters or fewer"),
    visible: z.boolean(),
  })
  .strict();

export const updateDiscoveryPreferencesSchema = z
  .object({
    enabled: z.boolean(),
    interests: z.array(discoveryInterestSchema).max(20, "A maximum of 20 interests is allowed"),
  })
  .strict()
  .superRefine(({ interests }, context) => {
    const normalizedNames = new Set<string>();
    interests.forEach((interest, index) => {
      const label = normalizeInterestLabel(interest.name);
      const normalizedName = normalizeInterestName(interest.name);
      if (!label) {
        context.addIssue({
          code: "custom",
          path: ["interests", index, "name"],
          message: "Interest name cannot be empty",
        });
      }
      if (normalizedName && normalizedNames.has(normalizedName)) {
        context.addIssue({
          code: "custom",
          path: ["interests", index, "name"],
          message: "Interest names must be unique after normalization",
        });
      }
      if (normalizedName) normalizedNames.add(normalizedName);
    });
  });

export type UpdateDiscoveryPreferencesPayload = z.infer<
  typeof updateDiscoveryPreferencesSchema
>;
