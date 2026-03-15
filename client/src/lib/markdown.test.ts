/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  it("renders fenced code blocks with highlight.js classes", () => {
    const html = parseMarkdown("```js\nconst n = 1;\n```");

    expect(html).toContain('class="hljs language-js"');
    expect(html).toContain('<span class="hljs-keyword">const</span>');
    expect(html).toContain("n =");
  });

  it("falls back to plaintext when language is unknown", () => {
    const html = parseMarkdown("```unknownlang\nhello\n```");

    expect(html).toContain('class="hljs language-plaintext"');
  });

  it("wraps markdown tables with a scroll container", () => {
    const html = parseMarkdown(
      [
        "| Name | Role |",
        "| --- | --- |",
        "| Alice | Writer |",
      ].join("\n")
    );

    expect(html).toContain('<div class="table-wrapper"><table>');
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
  });

  it("sanitizes raw html payloads", () => {
    const html = parseMarkdown(
      '<img src=x onerror=alert("xss")><script>alert("xss")</script>'
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
  });
});
