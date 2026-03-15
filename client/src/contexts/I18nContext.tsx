import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "ko" | "en";
export const LANGUAGE_STORAGE_KEY = "markdown-editor-language";

const FALLBACK_LANGUAGE: AppLanguage = "en";

export const TRANSLATIONS = {
  ko: {
    appTitle: "Markdown Editor",
    switchToEnglish: "영문으로 전환",
    switchToKorean: "한국어로 전환",
    languageButtonKo: "KO",
    languageButtonEn: "EN",
    menuLanguage: "언어 전환",
    statusInitialMobile: "편하게 작성하세요",
    statusInitialDesktop: "문서를 편하게 작성해보세요",
    statusTyping: "수정중",
    statusSavedMobile: "저장됨",
    statusSavedDesktop: "브라우저 로컬에 안전하게 저장됨",
    pasteImageNotSupportedTitle: "이미지 붙여넣기는 지원하지 않습니다.",
    pasteImageNotSupportedDescription: "텍스트만 붙여넣을 수 있습니다.",
    toastDownloadedMd: "MD 파일이 다운로드되었습니다.",
    toastCopiedMarkdown: "마크다운 내용이 클립보드에 복사되었습니다.",
    fileConvertedPrefix: "",
    fileConvertedSuffix: "파일이 마크다운으로 변환되었습니다.",
    fileConvertFailedTitle: "파일 변환 실패",
    fileConvertFailedDescription: "파일을 변환하는 중 오류가 발생했습니다.",
    resetSuccessTitle: "편집기가 초기화되었습니다.",
    resetSuccessDescription: "기본 내용으로 복원되고 레이아웃이 재조정되었습니다.",
    tooltipImport: "파일 가져오기 (HWP, DOCX, PDF, HTML, TXT, 이미지)",
    tooltipDownloadMd: "MD 파일 다운로드",
    tooltipCopyMarkdown: "마크다운 내용 복사",
    syncScroll: "싱크 스크롤",
    tooltipSyncScroll: "편집기와 프리뷰 스크롤 동기화",
    tooltipReset: "초기화 (기본 내용으로 복원)",
    tooltipThemeDark: "다크 모드",
    tooltipThemeLight: "라이트 모드",
    menuImport: "파일 가져오기",
    menuDownload: "MD 파일 다운로드",
    menuCopy: "마크다운 내용 복사",
    tabEditor: "편집",
    tabPreview: "미리보기",
    placeholderMarkdown: "마크다운을 입력하세요...",
    panelEditor: "Editor",
    panelPreview: "Preview",
    unitLines: "줄",
    unitChars: "자",
    unitWords: "단어",
    labelMarkdown: "Markdown",
    labelUtf8: "UTF-8",
    categoryHwp: "HWP/HWPX",
    categoryHtml: "HTML",
    categoryTxt: "텍스트",
    categoryDocx: "DOCX",
    categoryPdf: "PDF",
    categoryImage: "이미지 (OCR)",
    notFoundTitle: "Page Not Found",
    notFoundDescriptionLine1: "요청하신 페이지를 찾을 수 없습니다.",
    notFoundDescriptionLine2: "페이지가 이동되었거나 삭제되었을 수 있습니다.",
    goHome: "홈으로 이동",
    errorBoundaryTitle: "예상하지 못한 오류가 발생했습니다.",
    errorBoundaryReload: "페이지 새로고침",
  },
  en: {
    appTitle: "Markdown Editor",
    switchToEnglish: "Switch to English",
    switchToKorean: "Switch to Korean",
    languageButtonKo: "KO",
    languageButtonEn: "EN",
    menuLanguage: "Switch language",
    statusInitialMobile: "Start writing",
    statusInitialDesktop: "Start writing your document",
    statusTyping: "Typing",
    statusSavedMobile: "Saved",
    statusSavedDesktop: "Saved safely in browser storage",
    pasteImageNotSupportedTitle: "Image paste is not supported.",
    pasteImageNotSupportedDescription: "Only text paste is allowed.",
    toastDownloadedMd: "MD file downloaded.",
    toastCopiedMarkdown: "Markdown copied to clipboard.",
    fileConvertedPrefix: "",
    fileConvertedSuffix: "file converted to markdown.",
    fileConvertFailedTitle: "File conversion failed",
    fileConvertFailedDescription: "An error occurred while converting the file.",
    resetSuccessTitle: "Editor has been reset.",
    resetSuccessDescription: "Restored to default content and layout has been readjusted.",
    tooltipImport: "Import file (HWP, DOCX, PDF, HTML, TXT, image)",
    tooltipDownloadMd: "Download MD file",
    tooltipCopyMarkdown: "Copy markdown",
    syncScroll: "Sync scroll",
    tooltipSyncScroll: "Synchronize editor and preview scrolling",
    tooltipReset: "Reset to default content",
    tooltipThemeDark: "Dark mode",
    tooltipThemeLight: "Light mode",
    menuImport: "Import file",
    menuDownload: "Download MD file",
    menuCopy: "Copy markdown",
    tabEditor: "Editor",
    tabPreview: "Preview",
    placeholderMarkdown: "Type markdown...",
    panelEditor: "Editor",
    panelPreview: "Preview",
    unitLines: "lines",
    unitChars: "chars",
    unitWords: "words",
    labelMarkdown: "Markdown",
    labelUtf8: "UTF-8",
    categoryHwp: "HWP/HWPX",
    categoryHtml: "HTML",
    categoryTxt: "Text",
    categoryDocx: "DOCX",
    categoryPdf: "PDF",
    categoryImage: "Image (OCR)",
    notFoundTitle: "Page Not Found",
    notFoundDescriptionLine1: "Sorry, the page you are looking for doesn't exist.",
    notFoundDescriptionLine2: "It may have been moved or deleted.",
    goHome: "Go Home",
    errorBoundaryTitle: "An unexpected error occurred.",
    errorBoundaryReload: "Reload Page",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "ko" || value === "en";
}

export function resolveInitialLanguage(
  storedLanguage?: string | null,
  navigatorLanguage?: string | null
): AppLanguage {
  if (isAppLanguage(storedLanguage)) {
    return storedLanguage;
  }

  if (typeof navigatorLanguage === "string" && navigatorLanguage.toLowerCase().startsWith("ko")) {
    return "ko";
  }

  return FALLBACK_LANGUAGE;
}

export function getTranslation(language: AppLanguage, key: TranslationKey): string {
  return TRANSLATIONS[language][key];
}

type I18nContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return FALLBACK_LANGUAGE;
    return resolveInitialLanguage(
      localStorage.getItem(LANGUAGE_STORAGE_KEY),
      window.navigator.language
    );
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "ko" ? "en" : "ko"));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      return getTranslation(language, key);
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
