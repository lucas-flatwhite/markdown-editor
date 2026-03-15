# Test Results (2026-03-15)

## Test Plan

1. Static gate: TypeScript type-check.
2. Unit tests for critical logic:
   - Markdown rendering (`parseMarkdown`)
   - File conversion (`convertFileToMarkdown`)
3. Production build verification:
   - Frontend bundle (Vite)
   - Server bundle (esbuild)

## Executed Commands

```bash
bun run check
bun run test
bun run build
```

## Unit Test Coverage Added

- `client/src/lib/markdown.test.ts`
  - Highlight.js code block rendering class assertion
  - Unknown language fallback to plaintext
  - Table wrapper rendering for mobile-friendly preview
- `client/src/lib/fileConverter.test.ts`
  - `FILE_ACCEPT` consistency with supported extensions
  - TXT conversion success path
  - HTML conversion success path
  - Unsupported extension error path

## Results

- Type-check: `PASS`
- Unit tests: `PASS` (2 files, 7 tests)
- Build: `PASS`

## Notes / Non-blocking Warnings

- Build warns when these env placeholders are not set:
  - `VITE_ANALYTICS_ENDPOINT`
  - `VITE_ANALYTICS_WEBSITE_ID`
- Large bundle warning exists for some chunks (`> 500kB`) and may require additional code-splitting if bundle size optimization becomes a priority.
