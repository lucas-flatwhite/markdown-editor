/**
 * Markdown Editor - Editorial Workspace Design
 *
 * Design: Swiss Typographic Minimalism
 * - Warm off-white background, charcoal text, indigo accent
 * - JetBrains Mono for editor, Pretendard for UI/preview
 * - Content-first, minimal chrome
 *
 * Mobile: 2-row header, dropdown toolbar, tab-based editor/preview
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { parseMarkdown } from "@/lib/markdown";
import {
  useAutoSave,
  loadSavedContent,
  clearSavedContent,
} from "@/hooks/useAutoSave";
import type { SaveStatus } from "@/hooks/useAutoSave";
import { SAMPLE_MARKDOWN } from "@/lib/sampleMarkdown";
import { convertFileToMarkdown, FILE_ACCEPT } from "@/lib/fileConverter";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import {
  Download,
  Image as ImageIcon,
  FileUp,
  Sun,
  Moon,
  Type,
  Eye,
  RotateCcw,
  Loader2,
  Pencil,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { toPng } from "html-to-image";

const STORAGE_KEY = "markdown-editor-content";
const SAMPLE_VERSION_KEY = "markdown-editor-sample-version";
const CURRENT_SAMPLE_VERSION = "2";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [content, setContent] = useState<string>(() => {
    const savedVersion = localStorage.getItem(SAMPLE_VERSION_KEY);
    if (savedVersion !== CURRENT_SAMPLE_VERSION) {
      localStorage.setItem(SAMPLE_VERSION_KEY, CURRENT_SAMPLE_VERSION);
      localStorage.removeItem(STORAGE_KEY);
      return SAMPLE_MARKDOWN;
    }
    const saved = loadSavedContent();
    return saved !== null ? saved : SAMPLE_MARKDOWN;
  });
  const { status, lastSaved } = useAutoSave(content);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [isConverting, setIsConverting] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 마크다운 파싱 (메모이제이션)
  const parsedHtml = useMemo(() => parseMarkdown(content), [content]);

  // 클립보드 텍스트만 허용
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          toast.error("이미지 붙여넣기는 지원하지 않습니다.", {
            description: "텍스트만 붙여넣을 수 있습니다.",
          });
          return;
        }
      }
    },
    []
  );

  // MD 파일 다운로드
  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("MD 파일이 다운로드되었습니다.");
  }, [content]);

  // 프리뷰 이미지 다운로드
  const handleDownloadImage = useCallback(async () => {
    if (!previewRef.current) return;

    if (isMobile && mobileView !== "preview") {
      setMobileView("preview");
      toast.info("프리뷰 화면으로 전환 후 다시 시도해주세요.");
      return;
    }

    try {
      toast.info("이미지를 생성하고 있습니다...");
      const dataUrl = await toPng(previewRef.current, {
        backgroundColor: theme === "dark" ? "#1a1b2e" : "#fbfaf8",
        pixelRatio: 2,
        style: {
          padding: "2rem",
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "markdown-preview.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("이미지가 다운로드되었습니다.");
    } catch {
      toast.error("이미지 생성에 실패했습니다.");
    }
  }, [theme, isMobile, mobileView]);

  // 파일 가져오기 버튼 클릭
  const handleFileImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 파일 변환 처리
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsConverting(true);
      try {
        const { markdown, category } = await convertFileToMarkdown(file);
        setContent(markdown);
        toast.success(`${file.name}`, {
          description: `${category} 파일이 마크다운으로 변환되었습니다.`,
        });
      } catch (err: any) {
        toast.error("파일 변환 실패", {
          description: err.message || "파일을 변환하는 중 오류가 발생했습니다.",
        });
      } finally {
        setIsConverting(false);
        e.target.value = "";
      }
    },
    []
  );

  // 리셋 기능
  const handleReset = useCallback(() => {
    clearSavedContent();
    setContent(SAMPLE_MARKDOWN);
    setPanelKey((prev) => prev + 1);
    toast.success("편집기가 초기화되었습니다.", {
      description: "기본 내용으로 복원되고 레이아웃이 재조정되었습니다.",
    });
  }, []);

  // Tab 키 지원
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          content.substring(0, start) + "  " + content.substring(end);
        setContent(newContent);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [content]
  );

  // 자동 저장 상태 텍스트 (모바일에서 축약)
  const saveStatusText = useMemo(() => {
    if (status === "typing") return "수정중";
    if (status === "saved" || (status === "idle" && lastSaved)) {
      return isMobile ? "저장됨" : "브라우저 로컬에 안전하게 저장됨";
    }
    return "";
  }, [status, lastSaved, isMobile]);

  // 저장 상태 아이콘
  const SaveStatusIcon = useMemo(() => {
    if (status === "typing") return Pencil;
    return Shield;
  }, [status]);

  // 글자 수, 줄 수 계산
  const stats = useMemo(() => {
    const chars = content.length;
    const lines = content.split("\n").length;
    const words = content.trim()
      ? content.trim().split(/\s+/).length
      : 0;
    return { chars, lines, words };
  }, [content]);

  // ─── 데스크톱 헤더 (1단 구조, 기존과 동일) ───
  const desktopHeader = (
    <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Markdown Editor
        </h1>
        {saveStatusText && (
          <span
            className={`text-[11px] flex items-center gap-1 transition-colors ${
              status === "typing"
                ? "text-amber-500 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            <SaveStatusIcon className="w-3 h-3" />
            {saveStatusText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* 파일 가져오기 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleFileImport}
              disabled={isConverting}
            >
              {isConverting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            파일 가져오기 (HWP, DOCX, PDF, HTML, TXT, 이미지)
          </TooltipContent>
        </Tooltip>

        {/* MD 다운로드 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDownloadMd}
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>MD 파일 다운로드</TooltipContent>
        </Tooltip>

        {/* 이미지 다운로드 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDownloadImage}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>프리뷰를 이미지로 다운로드</TooltipContent>
        </Tooltip>

        {/* 구분선 */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* 리셋 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>초기화 (기본 내용으로 복원)</TooltipContent>
        </Tooltip>

        {/* 다크/라이트 모드 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "라이트 모드" : "다크 모드"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );

  // ─── 모바일 헤더 (2단 구조) ───
  const mobileHeader = (
    <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* 상단: 타이틀 + 저장 상태 + 핵심 아이콘 */}
      <div className="flex items-center justify-between px-3 h-11">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
            Markdown Editor
          </h1>
          {saveStatusText && (
            <span
              className={`text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap ${
                status === "typing"
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              <SaveStatusIcon className="w-3 h-3 shrink-0" />
              {saveStatusText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* 더보기 드롭다운 (파일 가져오기, MD 다운로드, 이미지 다운로드) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                {isConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleFileImport} disabled={isConverting}>
                <FileUp className="w-4 h-4 mr-2" />
                파일 가져오기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadMd}>
                <Download className="w-4 h-4 mr-2" />
                MD 파일 다운로드
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadImage}>
                <ImageIcon className="w-4 h-4 mr-2" />
                이미지로 다운로드
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 리셋 */}
          <Button variant="ghost" size="icon-sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* 다크/라이트 모드 */}
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 하단: 편집/미리보기 탭 전환 */}
      <div className="flex items-center px-3 pb-2">
        <div className="flex items-center bg-secondary rounded-md p-0.5 w-full">
          <button
            onClick={() => setMobileView("editor")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              mobileView === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            편집
          </button>
          <button
            onClick={() => setMobileView("preview")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              mobileView === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            미리보기
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header: 모바일/데스크톱 분기 */}
      {isMobile ? mobileHeader : desktopHeader}

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden">
        {isMobile ? (
          // 모바일: 탭 전환
          <div className="h-full">
            {mobileView === "editor" ? (
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="editor-textarea editor-textarea-mobile w-full h-full p-4 bg-background text-foreground border-none focus:outline-none"
                placeholder="마크다운을 입력하세요..."
                spellCheck={false}
              />
            ) : (
              <div className="h-full overflow-auto p-4">
                <div
                  ref={previewRef}
                  className="markdown-preview markdown-preview-mobile"
                  dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
              </div>
            )}
          </div>
        ) : (
          // 데스크톱: 리사이저블 패널
          <ResizablePanelGroup key={panelKey} direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full flex flex-col">
                <div className="flex items-center px-4 h-8 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Editor
                  </span>
                </div>
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  className="editor-textarea flex-1 w-full p-4 bg-background text-foreground border-none focus:outline-none"
                  placeholder="마크다운을 입력하세요..."
                  spellCheck={false}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full flex flex-col">
                <div className="flex items-center px-4 h-8 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Preview
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <div
                    ref={previewRef}
                    className="markdown-preview max-w-none"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 h-7 border-t border-border bg-card/80 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <span>{stats.lines} 줄</span>
          <span>{stats.chars} 자</span>
          {!isMobile && <span>{stats.words} 단어</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>Markdown</span>
          {!isMobile && <span>UTF-8</span>}
        </div>
      </footer>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
