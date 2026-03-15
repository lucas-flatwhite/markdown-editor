# 마크다운 편집기 디자인 브레인스토밍

## 요구사항 요약
- 즉시 사용 가능한 마크다운 편집기 (랜딩 없음)
- 좌측 편집기 / 우측 프리뷰 (50:50, 드래그로 30:70~70:30 조절)
- 다크/라이트 모드 (기본 라이트)
- md 다운로드, 이미지 다운로드, HWP/HWPX 변환
- 자동저장 (localStorage)
- 모바일 반응형 (세로 분할)
- 클립보드 텍스트만 허용

---

<response>
<text>

## 아이디어 1: "Editorial Workspace" — 에디토리얼 미니멀리즘

**Design Movement**: Swiss/International Typographic Style + 현대 에디터 UI
**Core Principles**:
1. 콘텐츠 우선 — 편집기 자체가 주인공, UI 크롬은 최소화
2. 타이포그래피 중심 — 글꼴 선택과 계층이 디자인을 이끈다
3. 기능적 단순함 — 모든 요소가 목적을 가진다

**Color Philosophy**: 
- 라이트: 따뜻한 오프화이트(#FAFAF8) 배경에 차콜(#2D2D2D) 텍스트, 포인트는 차분한 인디고(#4F46E5)
- 다크: 깊은 슬레이트(#1A1B26) 배경에 부드러운 크림(#E8E6DF) 텍스트

**Layout Paradigm**: 전체 뷰포트를 채우는 풀스크린 에디터. 상단 슬림 툴바, 중앙 분할 패널.

**Signature Elements**:
1. 편집기 영역의 미세한 라인 넘버링과 커서 하이라이트
2. 프리뷰 영역의 인쇄물 같은 타이포그래피 렌더링

**Interaction Philosophy**: 즉각적 반응, 최소 클릭. 키보드 중심 워크플로우.

**Animation**: 패널 리사이즈 시 부드러운 트랜지션, 테마 전환 시 페이드.

**Typography System**: JetBrains Mono (편집기) + Pretendard (UI/프리뷰)

</text>
<probability>0.08</probability>
</response>

<response>
<text>

## 아이디어 2: "Ink & Paper" — 아날로그 디지털 융합

**Design Movement**: Skeuomorphic Minimalism + Stationery Design
**Core Principles**:
1. 종이와 잉크의 촉감 — 디지털이지만 아날로그 감성
2. 따뜻한 톤 — 차가운 기술 느낌 배제
3. 섬세한 텍스처 — 미세한 종이 질감과 그림자

**Color Philosophy**:
- 라이트: 크림색 종이(#F5F0E8) 위에 세피아 톤 잉크(#3C3226), 포인트는 빈티지 레드(#C0392B)
- 다크: 다크 가죽(#1E1B18) 위에 골드 잉크(#D4A574)

**Layout Paradigm**: 노트북을 펼친 듯한 양면 레이아웃. 중앙에 "바인딩" 느낌의 구분선.

**Signature Elements**:
1. 종이 텍스처 배경과 미세한 그림자
2. 바인딩/스티칭 느낌의 중앙 디바이더

**Interaction Philosophy**: 물리적 사물을 다루는 듯한 인터랙션.

**Animation**: 페이지 넘기는 듯한 전환, 잉크가 스며드는 듯한 텍스트 입력.

**Typography System**: iA Writer Mono (편집기) + Noto Serif KR (프리뷰)

</text>
<probability>0.05</probability>
</response>

<response>
<text>

## 아이디어 3: "Code Studio" — 개발자 도구 미학

**Design Movement**: Developer Tool Aesthetics + Monochrome Industrial
**Core Principles**:
1. 정보 밀도 — 공간 낭비 없이 효율적 배치
2. 시스템 UI — OS 네이티브 도구처럼 신뢰감 있는 인터페이스
3. 명확한 상태 표시 — 현재 상태를 항상 알 수 있는 UI

**Color Philosophy**:
- 라이트: 깨끗한 화이트(#FFFFFF) 배경, 뉴트럴 그레이 계열, 포인트는 선명한 티얼(#0D9488)
- 다크: VS Code 스타일의 딥 네이비(#1E1E2E), 소프트 라벤더(#CDD6F4) 텍스트

**Layout Paradigm**: IDE 스타일 풀스크린. 컴팩트한 헤더 바 + 리사이저블 스플릿 뷰.

**Signature Elements**:
1. 상태 표시 바 (글자 수, 줄 수, 저장 상태)
2. 미니멀한 아이콘 기반 툴바

**Interaction Philosophy**: 빠르고 예측 가능한 반응. 개발자 도구의 신뢰감.

**Animation**: 최소한의 트랜지션, 상태 변화 시 미세한 피드백.

**Typography System**: Fira Code (편집기) + Pretendard (UI) + Noto Sans KR (프리뷰)

</text>
<probability>0.07</probability>
</response>

---

## 선택: 아이디어 1 — "Editorial Workspace"

에디토리얼 미니멀리즘을 선택합니다. 마크다운 편집기의 핵심은 "글쓰기"이며, 
콘텐츠 중심의 깔끔한 인터페이스가 가장 적합합니다. 
Swiss Typography의 명확한 계층 구조와 따뜻한 오프화이트 톤이 
장시간 글쓰기에 편안한 환경을 제공합니다.
