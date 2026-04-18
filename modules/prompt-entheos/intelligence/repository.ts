import { readJsonFile, writeJsonFile } from "@/modules/prompt-entheos/data/file-store";
import type { BrandIntelligenceProfile } from "@/modules/prompt-entheos/types";

const profilesFileName = "brand-intelligence-profiles.json";

export async function listStoredBrandIntelligenceProfiles(): Promise<BrandIntelligenceProfile[]> {
  return readJsonFile<BrandIntelligenceProfile[]>(profilesFileName, []);
}

export async function saveBrandIntelligenceProfiles(
  profiles: BrandIntelligenceProfile[],
): Promise<void> {
  await writeJsonFile(profilesFileName, profiles);
}
