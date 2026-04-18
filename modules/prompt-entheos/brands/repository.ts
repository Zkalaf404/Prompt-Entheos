import { readJsonFile, writeJsonFile } from "@/modules/prompt-entheos/data/file-store";
import type { BrandProfile } from "@/modules/prompt-entheos/types";

const brandsFileName = "brands.json";

export async function listBrandProfiles(): Promise<BrandProfile[]> {
  return readJsonFile<BrandProfile[]>(brandsFileName, []);
}

export async function saveBrandProfiles(brands: BrandProfile[]): Promise<void> {
  await writeJsonFile(brandsFileName, brands);
}
