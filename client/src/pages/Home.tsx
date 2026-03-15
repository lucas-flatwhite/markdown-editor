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
import { useI18n } from "@/contexts/I18nContext";
import { parseMarkdown } from "@/lib/markdown";
import {
  useAutoSave,
  loadSavedContent,
  clearSavedContent,
} from "@/hooks/useAutoSave";
import { getSampleMarkdown } from "@/lib/sampleMarkdown";
import {
  convertFileToMarkdown,
  FILE_ACCEPT,
  type FileCategory,
} from "@/lib/fileConverter";
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
  Copy,
  MessageSquare,
  Languages,
} from "lucide-react";

const STORAGE_KEY = "markdown-editor-content";
const SAMPLE_VERSION_KEY = "markdown-editor-sample-version";
const CURRENT_SAMPLE_VERSION = "4";

type ContentView = "editor" | "preview";

type SupportedFileCategory = Exclude<FileCategory, "unknown">;

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { language, t, toggleLanguage } = useI18n();

  const [content, setContent] = useState<string>(() => {
    const sampleVersionKey = `${SAMPLE_VERSION_KEY}-${language}`;
    const savedVersion = localStorage.getItem(sampleVersionKey);

    if (savedVersion !== CURRENT_SAMPLE_VERSION) {
      localStorage.setItem(sampleVersionKey, CURRENT_SAMPLE_VERSION);
      localStorage.removeItem(STORAGE_KEY);
      return getSampleMarkdown(language);
    }

    const saved = loadSavedContent();
    return saved !== null ? saved : getSampleMarkdown(language);
  });

  const { status, lastSaved, resetStatus } = useAutoSave(content);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<ContentView>("editor");
  const [isConverting, setIsConverting] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [syncScroll, setSyncScroll] = useState(false);
  const isSyncingScroll = useRef(false);

  const fileCategoryLabel: Record<SupportedFileCategory, string> = useMemo(
    () => ({
      hwp: t("categoryHwp"),
      html: t("categoryHtml"),
      txt: t("categoryTxt"),
      docx: t("categoryDocx"),
      pdf: t("categoryPdf"),
      image: t("categoryImage"),
    }),
    [t]
  );

  const switchLanguageLabel =
    language === "ko" ? t("switchToEnglish") : t("switchToKorean");

  const languageButtonLabel =
    language === "ko" ? t("languageButtonKo") : t("languageButtonEn");

  const fileConvertedDescription = useCallback(
    (category: SupportedFileCategory) => {
      return `${fileCategoryLabel[category]} ${t("fileConvertedSuffix")}`;
    },
    [fileCategoryLabel, t]
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const parsedHtml = useMemo(() => parseMarkdown(content), [content]);

  const handleEditorScroll = useCallback(() => {
    if (!syncScroll || isSyncingScroll.current) return;
    const editor = editorRef.current;
    const preview = previewScrollRef.current;
    if (!editor || !preview) return;

    isSyncingScroll.current = true;
    const scrollRatio =
      editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop =
      scrollRatio * (preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, [syncScroll]);

  const handlePreviewScroll = useCallback(() => {
    if (!syncScroll || isSyncingScroll.current) return;
    const editor = editorRef.current;
    const preview = previewScrollRef.current;
    if (!editor || !preview) return;

    isSyncingScroll.current = true;
    const scrollRatio =
      preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
    editor.scrollTop =
      scrollRatio * (editor.scrollHeight - editor.clientHeight);
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, [syncScroll]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          toast.error(t("pasteImageNotSupportedTitle"), {
            description: t("pasteImageNotSupportedDescription"),
          });
          return;
        }
      }
    },
    [t]
  );

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
    toast.success(t("toastDownloadedMd"));
  }, [content, t]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t("toastCopiedMarkdown"));
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(t("toastCopiedMarkdown"));
    }
  }, [content, t]);

  const handleFileImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsConverting(true);
      try {
        const { markdown, category } = await convertFileToMarkdown(file);
        setContent(markdown);
        toast.success(file.name, {
          description: fileConvertedDescription(category),
        });
      } catch {
        toast.error(t("fileConvertFailedTitle"), {
          description: t("fileConvertFailedDescription"),
        });
      } finally {
        setIsConverting(false);
        e.target.value = "";
      }
    },
    [fileConvertedDescription, t]
  );

  const handleReset = useCallback(() => {
    clearSavedContent();
    setContent(getSampleMarkdown(language));
    setPanelKey((prev) => prev + 1);
    resetStatus();
    toast.success(t("resetSuccessTitle"), {
      description: t("resetSuccessDescription"),
    });
  }, [language, resetStatus, t]);

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

  const saveStatusText = useMemo(() => {
    if (status === "initial") {
      return isMobile ? t("statusInitialMobile") : t("statusInitialDesktop");
    }
    if (status === "typing") return t("statusTyping");
    if (status === "saved" || (status === "idle" && lastSaved)) {
      return isMobile ? t("statusSavedMobile") : t("statusSavedDesktop");
    }
    return "";
  }, [status, lastSaved, isMobile, t]);

  const SaveStatusIcon = useMemo(() => {
    if (status === "initial") return MessageSquare;
    if (status === "typing") return Pencil;
    return Shield;
  }, [status]);

  const saveStatusColor = useMemo(() => {
    if (status === "initial") return "text-muted-foreground";
    if (status === "typing") return "text-amber-500 dark:text-amber-400";
    return "text-muted-foreground";
  }, [status]);

  const stats = useMemo(() => {
    const chars = content.length;
    const lines = content.split("\n").length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { chars, lines, words };
  }, [content]);

  const desktopHeader = (
    <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
          {t("appTitle")}
        </h1>
        {saveStatusText && (
          <span
            className={`text-[11px] flex items-center gap-1 transition-colors ${saveStatusColor}`}
          >
            <SaveStatusIcon className="w-3 h-3" />
            {saveStatusText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
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
          <TooltipContent>{t("tooltipImport")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleDownloadMd}>
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("tooltipDownloadMd")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleCopyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("tooltipCopyMarkdown")}</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded hover:bg-accent transition-colors">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-[11px] text-muted-foreground whitespace-nowrap select-none">
                {t("syncScroll")}
              </span>
            </label>
          </TooltipTrigger>
          <TooltipContent>{t("tooltipSyncScroll")}</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("tooltipReset")}</TooltipContent>
        </Tooltip>

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
            {theme === "dark" ? t("tooltipThemeLight") : t("tooltipThemeDark")}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[11px]"
              onClick={toggleLanguage}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{languageButtonLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{switchLanguageLabel}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );

  const mobileHeader = (
    <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 h-11">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
            {t("appTitle")}
          </h1>
          {saveStatusText && (
            <span
              className={`text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap ${saveStatusColor}`}
            >
              <SaveStatusIcon className="w-3 h-3 shrink-0" />
              {saveStatusText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleFileImport} disabled={isConverting}>
                <FileUp className="w-4 h-4 mr-2" />
                {t("menuImport")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadMd}>
                <Download className="w-4 h-4 mr-2" />
                {t("menuDownload")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                {t("menuCopy")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLanguage}>
                <Languages className="w-4 h-4 mr-2" />
                {switchLanguageLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

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
            {t("tabEditor")}
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
            {t("tabPreview")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {isMobile ? mobileHeader : desktopHeader}

      <main className="flex-1 overflow-hidden">
        {isMobile ? (
          <div className="h-full">
            {mobileView === "editor" ? (
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="editor-textarea editor-textarea-mobile w-full h-full p-4 bg-background text-foreground border-none focus:outline-none"
                placeholder={t("placeholderMarkdown")}
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
          <ResizablePanelGroup key={panelKey} direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full flex flex-col">
                <div className="flex items-center px-4 h-8 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t("panelEditor")}
                  </span>
                </div>
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onScroll={handleEditorScroll}
                  className="editor-textarea flex-1 w-full p-4 bg-background text-foreground border-none focus:outline-none"
                  placeholder={t("placeholderMarkdown")}
                  spellCheck={false}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full flex flex-col">
                <div className="flex items-center px-4 h-8 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t("panelPreview")}
                  </span>
                </div>
                <div
                  ref={previewScrollRef}
                  className="flex-1 overflow-auto p-4"
                  onScroll={handlePreviewScroll}
                >
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

      <footer className="flex items-center justify-between px-4 h-7 border-t border-border bg-card/80 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <span>{stats.lines} {t("unitLines")}</span>
          <span>{stats.chars} {t("unitChars")}</span>
          {!isMobile && <span>{stats.words} {t("unitWords")}</span>}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://x.com/lucas_flatwhite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:opacity-70 transition-opacity no-underline"
          >
            @lucas_flatwhite
          </a>
          <span>{t("labelMarkdown")}</span>
          {!isMobile && <span>{t("labelUtf8")}</span>}
        </div>
      </footer>

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
