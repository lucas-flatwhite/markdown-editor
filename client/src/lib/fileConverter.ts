/**
 * 다양한 파일 형식을 마크다운으로 변환하는 유틸리티
 *
 * 지원 형식:
 * - HWP/HWPX: 한글 문서
 * - HTML/HTM: HTML 문서 → 마크다운 변환
 * - TXT: 텍스트 파일 → 그대로 로드
 * - DOCX: Word 문서 → HTML → 마크다운 변환
 * - PDF: PDF 문서 → 텍스트 추출
 * - JPG/JPEG/PNG: 이미지 → OCR 텍스트 추출
 */

import { convertHwpToMarkdown } from "./hwpParser";

/** 지원하는 파일 확장자 목록 */
export const SUPPORTED_EXTENSIONS = [
  "hwp",
  "hwpx",
  "html",
  "htm",
  "txt",
  "docx",
  "pdf",
  "jpg",
  "jpeg",
  "png",
];

/** 파일 input의 accept 속성 값 */
export const FILE_ACCEPT = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(
  ","
);

export type FileCategory =
  | "hwp"
  | "html"
  | "txt"
  | "docx"
  | "pdf"
  | "image"
  | "unknown";

/** 확장자별 카테고리 */
function getFileCategory(ext: string): FileCategory {
  if (ext === "hwp" || ext === "hwpx") return "hwp";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "txt") return "txt";
  if (ext === "docx") return "docx";
  if (ext === "pdf") return "pdf";
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return "image";
  return "unknown";
}

/** TXT 파일 읽기 */
async function convertTxt(file: File): Promise<string> {
  return await file.text();
}

/** HTML 파일 → 마크다운 변환 */
async function convertHtml(file: File): Promise<string> {
  const html = await file.text();
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  // body 내용만 추출 시도
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : html;
  return turndown.turndown(content);
}

/** DOCX 파일 → 마크다운 변환 (mammoth를 통해 HTML → turndown) */
async function convertDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });

  if (!result.value || result.value.trim().length === 0) {
    throw new Error("DOCX 파일에서 내용을 추출할 수 없습니다.");
  }

  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  return turndown.turndown(result.value);
}

/** PDF 파일 → 텍스트 추출 */
async function convertPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // PDF.js 워커 설정
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    if (pageText.trim()) {
      textParts.push(pageText.trim());
    }
  }

  if (textParts.length === 0) {
    throw new Error("PDF 파일에서 텍스트를 추출할 수 없습니다.");
  }

  return textParts.join("\n\n");
}

/** 이미지 → OCR 텍스트 추출 (Tesseract.js) */
async function convertImage(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");

  const result = await Tesseract.recognize(file, "kor+eng", {
    logger: () => {},
  });

  const text = result.data.text.trim();

  if (!text) {
    throw new Error("이미지에서 텍스트를 추출할 수 없습니다.");
  }

  return text;
}

/**
 * 파일을 마크다운으로 변환하는 메인 함수
 */
export async function convertFileToMarkdown(file: File): Promise<{
  markdown: string;
  category: Exclude<FileCategory, "unknown">;
}> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const category = getFileCategory(ext);

  if (category === "unknown") {
    throw new Error(
      `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  let markdown: string;

  switch (category) {
    case "hwp":
      markdown = await convertHwpToMarkdown(file);
      break;
    case "html":
      markdown = await convertHtml(file);
      break;
    case "txt":
      markdown = await convertTxt(file);
      break;
    case "docx":
      markdown = await convertDocx(file);
      break;
    case "pdf":
      markdown = await convertPdf(file);
      break;
    case "image":
      markdown = await convertImage(file);
      break;
  }

  return {
    markdown,
    category,
  };
}
