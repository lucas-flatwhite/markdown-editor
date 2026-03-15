/**
 * HWP/HWPX 파일을 마크다운으로 변환하는 유틸리티
 * 
 * HWPX는 ZIP 기반 XML 포맷이므로 브라우저에서 파싱 가능합니다.
 * HWP(바이너리)는 제한적으로 텍스트 추출을 시도합니다.
 */

/**
 * HWPX 파일 파싱 (ZIP 기반 XML)
 */
async function parseHwpx(file: File): Promise<string> {
  // JSZip을 동적으로 로드
  const JSZip = (await import("jszip")).default;
  
  const zip = await JSZip.loadAsync(file);
  const markdownParts: string[] = [];

  // HWPX의 본문 XML 파일들을 찾아 파싱
  const sectionFiles: string[] = [];
  
  zip.forEach((relativePath: string) => {
    if (relativePath.match(/Contents\/section\d+\.xml/i) || 
        relativePath.match(/Contents\/content\.xml/i)) {
      sectionFiles.push(relativePath);
    }
  });

  // 섹션 파일을 정렬
  sectionFiles.sort();

  for (const sectionPath of sectionFiles) {
    const xmlContent = await zip.file(sectionPath)?.async("string");
    if (xmlContent) {
      const parsed = parseHwpxXml(xmlContent);
      if (parsed.trim()) {
        markdownParts.push(parsed);
      }
    }
  }

  if (markdownParts.length === 0) {
    // 모든 XML 파일에서 텍스트 추출 시도
    const allTexts: string[] = [];
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (path.endsWith(".xml") && !(zipEntry as any).dir) {
        try {
          const content = await (zipEntry as any).async("string");
          const text = extractTextFromXml(content);
          if (text.trim()) {
            allTexts.push(text);
          }
        } catch {
          // 개별 파일 파싱 실패 무시
        }
      }
    }
    if (allTexts.length > 0) {
      return allTexts.join("\n\n");
    }
    throw new Error("HWPX 파일에서 텍스트를 추출할 수 없습니다.");
  }

  return markdownParts.join("\n\n");
}

/**
 * HWPX XML을 마크다운으로 변환
 */
function parseHwpxXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const lines: string[] = [];

  // 모든 텍스트 노드 순회
  const paragraphs = doc.querySelectorAll("p, P");
  
  if (paragraphs.length > 0) {
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim() || "";
      if (text) {
        lines.push(text);
      }
    });
  } else {
    // p 태그가 없으면 일반 텍스트 추출
    const text = extractTextFromXml(xml);
    if (text) {
      lines.push(text);
    }
  }

  return lines.join("\n\n");
}

/**
 * XML에서 순수 텍스트 추출
 */
function extractTextFromXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  
  // 텍스트 관련 요소들에서 추출
  const textElements = doc.querySelectorAll(
    "[charPrIDRef], t, T, text, Text, run, Run, span, Span"
  );
  
  if (textElements.length > 0) {
    const texts: string[] = [];
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        texts.push(text);
      }
    });
    return texts.join(" ");
  }

  // 최후의 수단: 전체 텍스트 콘텐츠
  return doc.documentElement.textContent?.trim() || "";
}

/**
 * HWP 바이너리 파일에서 텍스트 추출 시도
 */
async function parseHwp(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  
  // HWP 파일 시그니처 확인 (OLE2 Compound Document)
  const ole2Signature = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
  const isOle2 = ole2Signature.every((byte, i) => uint8[i] === byte);
  
  if (!isOle2) {
    throw new Error("유효한 HWP 파일이 아닙니다.");
  }

  // 바이너리에서 한글/영문 텍스트 추출 시도
  const texts: string[] = [];
  const decoder = new TextDecoder("utf-16le");
  
  // HWP 파일의 텍스트 스트림에서 읽기 가능한 문자열 추출
  let currentText = "";
  
  for (let i = 0; i < uint8.length - 1; i += 2) {
    const charCode = uint8[i] | (uint8[i + 1] << 8);
    
    // 인쇄 가능한 문자 범위 (한글, 영문, 숫자, 기본 기호)
    if (
      (charCode >= 0x20 && charCode <= 0x7E) || // ASCII
      (charCode >= 0xAC00 && charCode <= 0xD7A3) || // 한글 음절
      (charCode >= 0x3131 && charCode <= 0x318E) || // 한글 자모
      (charCode >= 0x2000 && charCode <= 0x206F) || // 일반 구두점
      charCode === 0x000A || charCode === 0x000D // 줄바꿈
    ) {
      currentText += String.fromCharCode(charCode);
    } else {
      if (currentText.trim().length > 3) {
        texts.push(currentText.trim());
      }
      currentText = "";
    }
  }
  
  if (currentText.trim().length > 3) {
    texts.push(currentText.trim());
  }

  if (texts.length === 0) {
    throw new Error(
      "HWP 바이너리 파일에서 텍스트를 추출할 수 없습니다. HWPX 형식을 사용해주세요."
    );
  }

  // 중복 제거 및 정리
  const uniqueTexts = Array.from(new Set(texts));
  return uniqueTexts.join("\n\n");
}

/**
 * HWP/HWPX 파일을 마크다운으로 변환
 */
export async function convertHwpToMarkdown(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "hwpx") {
    return parseHwpx(file);
  } else if (extension === "hwp") {
    return parseHwp(file);
  } else {
    throw new Error("지원하지 않는 파일 형식입니다. HWP 또는 HWPX 파일을 선택해주세요.");
  }
}
