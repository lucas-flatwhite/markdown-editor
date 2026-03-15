import { useEffect, useRef, useCallback, useState } from "react";

const STORAGE_KEY = "markdown-editor-content";
const SAVE_DELAY = 1000; // 1초 디바운스

export type SaveStatus = "initial" | "idle" | "typing" | "saved";

export function useAutoSave(content: string, enabled: boolean = true) {
  const [status, setStatus] = useState<SaveStatus>("initial");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const save = useCallback((value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      setLastSaved(new Date());
      setStatus("saved");
    } catch {
      // localStorage가 가득 찬 경우 무시
    }
  }, []);

  // 리셋 시 상태를 initial로 되돌리는 함수
  const resetStatus = useCallback(() => {
    setStatus("initial");
    setLastSaved(null);
    isFirstRender.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 최초 렌더링 시에는 저장하지 않음 (initial 상태 유지)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 타이핑 시작 → "수정중" 표시
    setStatus("typing");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      save(content);
    }, SAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, save, enabled]);

  return { status, lastSaved, resetStatus };
}

export function loadSavedContent(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearSavedContent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}
