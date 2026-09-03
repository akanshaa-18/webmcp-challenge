import { CreativeFile } from "@/lib/types";

export interface DuplicateGroup {
  hash: string;
  fileIds: string[];
  safeDeletionCandidateIds: string[];
  protectedFileIds: string[];
}

export interface SimilarVersionGroup {
  familyKey: string;
  fileIds: string[];
}

export interface DuplicateDetectionResult {
  exactDuplicates: DuplicateGroup[];
  similarVersions: SimilarVersionGroup[];
  protectedFiles: string[];
}

function fileFamilyKey(name: string): string {
  const lower = name.toLowerCase().replace(/\.[^.]+$/, "");
  return lower
    .replace(/-v\d+$/g, "")
    .replace(/-final$/g, "")
    .replace(/-copy$/g, "");
}

export function detectDuplicates(files: CreativeFile[]): DuplicateDetectionResult {
  const byHash = new Map<string, CreativeFile[]>();
  const byFamily = new Map<string, CreativeFile[]>();

  for (const file of files) {
    const hashGroup = byHash.get(file.hash) ?? [];
    hashGroup.push(file);
    byHash.set(file.hash, hashGroup);

    const familyKey = fileFamilyKey(file.name);
    const familyGroup = byFamily.get(familyKey) ?? [];
    familyGroup.push(file);
    byFamily.set(familyKey, familyGroup);
  }

  const exactDuplicates: DuplicateGroup[] = [];
  for (const [hash, group] of byHash.entries()) {
    if (group.length < 2) continue;
    const protectedFileIds = group.filter((file) => file.approved).map((file) => file.id);
    const safeDeletionCandidateIds =
      protectedFileIds.length > 0
        ? group.filter((file) => !file.approved).map((file) => file.id)
        : [];

    exactDuplicates.push({
      hash,
      fileIds: group.map((file) => file.id),
      safeDeletionCandidateIds,
      protectedFileIds,
    });
  }

  const similarVersions: SimilarVersionGroup[] = [];
  for (const [familyKey, group] of byFamily.entries()) {
    if (group.length < 2) continue;
    const distinctHashes = new Set(group.map((file) => file.hash));
    if (distinctHashes.size < 2) continue;
    similarVersions.push({
      familyKey,
      fileIds: group.map((file) => file.id),
    });
  }

  return {
    exactDuplicates,
    similarVersions,
    protectedFiles: files.filter((file) => file.approved).map((file) => file.id),
  };
}

export function getSafeDeletionCandidates(result: DuplicateDetectionResult): string[] {
  return result.exactDuplicates.flatMap((group) => group.safeDeletionCandidateIds);
}

