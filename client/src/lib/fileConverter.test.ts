import { describe, expect, it } from "vitest";
import {
  FILE_ACCEPT,
  SUPPORTED_EXTENSIONS,
  convertFileToMarkdown,
} from "./fileConverter";

describe("fileConverter", () => {
  it("keeps FILE_ACCEPT in sync with SUPPORTED_EXTENSIONS", () => {
    const expected = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
    expect(FILE_ACCEPT).toBe(expected);
  });

  it("converts TXT files and returns text category", async () => {
    const file = new File(["plain text"], "NOTE.TXT", {
      type: "text/plain",
    });

    const result = await convertFileToMarkdown(file);
    expect(result.markdown).toBe("plain text");
    expect(result.category).toBe("텍스트");
  });

  it("converts HTML files into markdown content", async () => {
    const file = new File(
      [
        [
          "<html><head><title>x</title></head>",
          "<body><h1>Title</h1><p>Hello world</p></body></html>",
        ].join(""),
      ],
      "sample.html",
      { type: "text/html" }
    );

    const result = await convertFileToMarkdown(file);
    expect(result.category).toBe("HTML");
    expect(result.markdown).toContain("# Title");
    expect(result.markdown).toContain("Hello world");
    expect(result.markdown).not.toContain("<title>");
  });

  it("throws for unsupported extension", async () => {
    const file = new File(["content"], "sample.exe", {
      type: "application/octet-stream",
    });

    await expect(convertFileToMarkdown(file)).rejects.toThrow(
      "지원하지 않는 파일 형식입니다."
    );
  });
});
