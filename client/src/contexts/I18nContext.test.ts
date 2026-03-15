import { describe, expect, it } from "vitest";
import { getTranslation, resolveInitialLanguage } from "./I18nContext";

describe("I18nContext helpers", () => {
  it("prefers a valid stored language", () => {
    expect(resolveInitialLanguage("ko", "en-US")).toBe("ko");
    expect(resolveInitialLanguage("en", "ko-KR")).toBe("en");
  });

  it("falls back to browser language when stored language is invalid", () => {
    expect(resolveInitialLanguage("fr", "ko-KR")).toBe("ko");
    expect(resolveInitialLanguage(null, "en-US")).toBe("en");
  });

  it("returns translated strings for each locale", () => {
    expect(getTranslation("ko", "tabPreview")).toBe("미리보기");
    expect(getTranslation("en", "tabPreview")).toBe("Preview");
  });
});
