# Markdown Editor

[한국어 문서 (Korean README)](./README.ko.md)

Markdown Editor is a content-first writing workspace that combines a live markdown editor, a styled preview, and practical import/export tools for everyday documentation work.

## Project Purpose

This project focuses on fast markdown authoring with immediate visual feedback and minimal friction:

- Write and preview markdown side-by-side in real time.
- Convert common document formats into markdown for reuse.
- Keep writing safe with local auto-save and robust error boundaries.
- Offer a responsive editor experience on both desktop and mobile.

## Core Features

- Live markdown preview with `marked`, `highlight.js`, and HTML sanitization.
- Resizable desktop split layout (editor/preview).
- Mobile tab switcher for editor and preview.
- Auto-save with debounce to `localStorage`.
- Theme toggle (`light`/`dark`).
- Bilingual UI (`English` / `Korean`) with language preference persistence.
- Runtime `<html lang>` synchronization based on selected language.
- Localized sample markdown content for both `en` and `ko`.
- Sync-scroll between editor and preview.
- Markdown copy and `.md` file download.
- File import and conversion:
  - `HWP/HWPX`
  - `HTML/HTM`
  - `TXT`
  - `DOCX`
  - `PDF`
  - `JPG/JPEG/PNG` (OCR)

## Design Direction

The UI follows a Swiss typographic minimalism approach:

- Warm off-white / charcoal base with indigo accents.
- `Pretendard` for interface and preview text.
- `JetBrains Mono` for editing and code readability.
- Low-chrome layout prioritizing content over controls.

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Styling/UI: Tailwind CSS 4, shadcn/ui, Radix UI
- Markdown pipeline: marked, highlight.js, DOMPurify
- Conversion libs: turndown, mammoth, pdfjs-dist, tesseract.js, jszip
- i18n: custom React context-based localization (`en` / `ko`)
- Server: Express (static serving for production build)
- Testing: Vitest

## Project Structure

```text
client/        # React application
server/        # Express server entry
shared/        # Shared constants/types
dist/          # Build outputs
```

## Getting Started

### Prerequisites

- Bun (recommended for this repository workflow) or pnpm-compatible Node.js environment

### Install

```bash
bun install
```

### Run in Development

```bash
bun run dev
```

### Build and Run Production

```bash
bun run build
bun run start
```

## Quality and Testing

### Test Plan

1. Static quality gate: TypeScript typecheck.
2. Unit tests for critical logic:
   - Markdown rendering behavior (code block highlighting, table wrapper).
   - File conversion behavior (TXT/HTML success paths, unsupported extension errors).
   - Localization behavior (language selection and translation mapping).
3. Production bundle verification with Vite and server bundling.

### Commands

```bash
bun run check
bun run test
bun run build
```

## Environment Notes

`client/index.html` contains optional analytics placeholders:

- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

If not set, Vite emits warnings during build. This does not block the build.

Optional debug collector:

- `DEBUG_COLLECTOR=true` enables debug log collector script in development mode.
- Debug logs are written into `.debug-logs/`.

## License

MIT
