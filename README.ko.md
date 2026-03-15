# Markdown Editor

[English README](./README.md)

Markdown Editor는 실시간 편집과 미리보기를 중심으로, 문서 가져오기/내보내기 기능을 통합한 마크다운 작업용 웹 애플리케이션입니다.

## 프로젝트 목적

이 프로젝트는 문서를 빠르게 작성하고 재사용할 수 있도록 다음에 초점을 맞춥니다.

- 마크다운을 작성하면서 즉시 결과를 확인
- 기존 문서 파일을 마크다운으로 변환해 재활용
- 로컬 자동 저장으로 작성 중 데이터 보호
- 데스크톱/모바일 모두에서 일관된 편집 경험 제공

## 주요 기능

- `marked`, `highlight.js`, HTML sanitize 기반 실시간 미리보기
- 데스크톱 좌우 분할 리사이즈 레이아웃 (편집/미리보기)
- 모바일 편집/미리보기 탭 전환
- `localStorage` 디바운스 자동 저장
- 라이트/다크 테마 전환
- 편집기-미리보기 싱크 스크롤
- 마크다운 클립보드 복사 및 `.md` 다운로드
- 파일 가져오기 및 변환 지원:
  - `HWP/HWPX`
  - `HTML/HTM`
  - `TXT`
  - `DOCX`
  - `PDF`
  - `JPG/JPEG/PNG` (OCR)

## 디자인 방향

UI는 Swiss typographic minimalism 방향으로 설계되었습니다.

- 따뜻한 오프화이트/차콜 톤과 인디고 포인트 컬러
- UI/프리뷰 타이포그래피: `Pretendard`
- 편집기/코드 가독성: `JetBrains Mono`
- 컨트롤보다 콘텐츠 중심의 저크롬 레이아웃

## 기술 스택

- 프론트엔드: React 19, TypeScript, Vite
- 스타일/UI: Tailwind CSS 4, shadcn/ui, Radix UI
- 마크다운 파이프라인: marked, highlight.js, DOMPurify
- 변환 라이브러리: turndown, mammoth, pdfjs-dist, tesseract.js, jszip
- 서버: Express (프로덕션 정적 파일 서빙)
- 테스트: Vitest

## 프로젝트 구조

```text
client/        # React 애플리케이션
server/        # Express 서버 엔트리
shared/        # 공용 상수/타입
dist/          # 빌드 산출물
```

## 시작하기

### 사전 요구사항

- Bun (이 저장소 기준 권장) 또는 pnpm 호환 Node.js 환경

### 의존성 설치

```bash
bun install
```

### 개발 서버 실행

```bash
bun run dev
```

### 프로덕션 빌드/실행

```bash
bun run build
bun run start
```

## 품질 관리 및 테스트

### 테스트 계획

1. 정적 검증: TypeScript 타입체크
2. 핵심 로직 단위 테스트
   - 마크다운 렌더링 동작(코드 하이라이트, 테이블 래퍼)
   - 파일 변환 동작(TXT/HTML 정상 경로, 미지원 확장자 오류)
3. 프로덕션 번들 검증(Vite + 서버 번들)

### 실행 명령

```bash
bun run check
bun run test
bun run build
```

## 환경 변수 참고

`client/index.html`에는 선택적 분석 스크립트 자리표시자가 포함되어 있습니다.

- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

값이 없으면 빌드 시 경고가 출력되지만 빌드 자체는 정상 진행됩니다.

## 라이선스

MIT
