import { CreativeFile } from "@/lib/types";

export function searchCreativeFiles(query: string, files: CreativeFile[]): CreativeFile[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  return [...files]
    .map((file) => {
      const haystack = `${file.name} ${file.type}`.toLowerCase();
      const score = tokens.reduce((acc, token) => {
        if (haystack.includes(token)) {
          return acc + 2;
        }
        return acc;
      }, 0);
      const logoBoost = haystack.includes("logo") ? 1 : 0;
      const approvedBoost = file.approved ? 1 : 0;
      return { file, score: score + logoBoost + approvedBoost };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.file.modifiedAt).getTime() - new Date(a.file.modifiedAt).getTime();
    })
    .map((entry) => entry.file);
}

