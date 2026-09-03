import { describe, expect, it } from "vitest";
import { creativeFilesFixture } from "@/lib/fixtures";
import { searchCreativeFiles } from "@/lib/file-search";

describe("file search", () => {
  it("returns Kaftan logo files for Kaftan logo query", () => {
    const results = searchCreativeFiles("Kaftan logo", creativeFilesFixture);
    const ids = results.map((result) => result.id);
    expect(ids).toContain("kaftan-logo-final");
    expect(ids).toContain("kaftan-logo-v2");
    expect(ids).toContain("kaftan-logo-copy");
  });
});

