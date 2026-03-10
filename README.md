# Markdown Editor

실시간 프리뷰를 지원하는 마크다운 편집기 웹 애플리케이션입니다.

## 주요 기능

- **실시간 마크다운 프리뷰** — 좌우 분할 레이아웃으로 편집과 프리뷰를 동시에 확인
- **드래그 가능한 레이아웃** — 30:70 ~ 70:30 비율로 패널 크기 조절
- **다크/라이트 모드** — 테마 전환 지원 (기본 라이트 모드)
- **파일 가져오기** — HWP, HWPX, HTML, TXT, DOCX, PDF, 이미지(OCR) 지원
- **다운로드** — MD 파일 다운로드, 프리뷰 이미지 다운로드
- **자동 저장** — localStorage 기반 자동 저장 (1초 디바운스)
- **클립보드 제한** — 텍스트만 붙여넣기 허용 (이미지 차단)
- **모바일 반응형** — 편집/미리보기 탭 전환, 2단 헤더 구조
- **코드 하이라이팅** — highlight.js 기반 구문 강조

## 기술 스택

- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- marked + highlight.js + DOMPurify
- mammoth (DOCX), pdfjs-dist (PDF), tesseract.js (OCR)
- html-to-image, turndown

## 시작하기

```bash
pnpm install
pnpm dev
```

## 라이선스

MIT
