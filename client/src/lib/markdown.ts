import { marked, type Tokens } from "marked";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

// Configure marked with highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer for code highlighting
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

// Wrap tables in a scrollable container for mobile
renderer.table = function (token: Tokens.Table) {
  const alignAttr = (align: string | null) => {
    if (!align) return "";
    return ` style="text-align:${align}"`;
  };

  // Build header
  const headerCells = token.header
    .map((cell) => `<th${alignAttr(cell.align)}>${this.parser.parseInline(cell.tokens)}</th>`)
    .join("");
  const headerHtml = `<thead><tr>${headerCells}</tr></thead>`;

  // Build body rows
  const bodyRows = token.rows
    .map((row) => {
      const cells = row
        .map((cell) => `<td${alignAttr(cell.align)}>${this.parser.parseInline(cell.tokens)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  const bodyHtml = bodyRows ? `<tbody>${bodyRows}</tbody>` : "";

  return `<div class="table-wrapper"><table>${headerHtml}${bodyHtml}</table></div>`;
};

marked.use({ renderer });

export function parseMarkdown(content: string): string {
  const rawHtml = marked.parse(content) as string;
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["input"],
    ADD_ATTR: ["type", "checked", "disabled", "class", "style"],
  });
}
