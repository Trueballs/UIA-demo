// src/hooks/useAiLayoutStyles.ts
import { LLMLayoutResponse } from "@/types/llm-layout";

/**
 * Hook to convert LLM design tokens to React inline styles & Tailwind classes
 * Bridges the gap between AI layout tokens and browser rendering
 */
export function useAiLayoutStyles(aiData: LLMLayoutResponse | null) {
  if (!aiData) {
    return {
      textContainerClass: "",
      textPositioningClass: "",
      textAlignClass: "text-left",
      maxWidthClass: "max-w-[520px]",
      colorTheme: "brand" as const,
      logoPlacement: "top-right",
      useGlassPanel: false,
    };
  }

  return {
    textContainerClass: `absolute ${aiData.design_tokens.text_positioning} ${aiData.design_tokens.max_width}`,
    textPositioningClass: aiData.design_tokens.text_positioning,
    textAlignClass: aiData.design_tokens.text_alignment,
    maxWidthClass: aiData.design_tokens.max_width,
    colorTheme: aiData.design_tokens.color_theme,
    logoPlacement: aiData.logo_config.placement,
    useGlassPanel: aiData.logo_config.use_glass_panel,
  };
}

/**
 * Parse Tailwind positioning classes into inline CSS styles
 * Example: "left-[600px] bottom-[42px]" → { left: "600px", bottom: "42px" }
 */
export function parseTailwindPosition(positioning: string): Record<string, string> {
  const styles: Record<string, string> = {};
  const tokens = positioning.split(/\s+/);

  tokens.forEach(token => {
    const match = token.match(/^(left|right|top|bottom)-\[([^\]]+)\]$/);
    if (match) {
      const [, prop, value] = match;
      styles[prop] = value;
    }
  });

  return styles;
}

/**
 * Get contrasting text color based on theme
 */
export function getTextColorFromTheme(theme: "dark" | "light" | "brand", brandColor?: string): string {
  switch (theme) {
    case "dark":
      return "#ffffff";
    case "light":
      return "#000000";
    case "brand":
    default:
      return "#ffffff"; // Assume white text on brand color
  }
}
