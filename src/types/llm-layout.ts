// src/types/llm-layout.ts
export interface LLMLayoutResponse {
  selected_base_layout: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
  reasoning: string;
  content: {
    headline: string;
    subtext: string;
    call_to_action?: string;
  };
  design_tokens: {
    text_positioning: string;      // e.g., "left-[600px] top-10"
    text_alignment: string;         // e.g., "text-left"
    max_width: string;              // e.g., "max-w-[500px]"
    color_theme: "dark" | "light" | "brand";
  };
  logo_config: {
    placement: string;              // e.g., "top-right", "bottom-center"
    use_glass_panel: boolean;
  };
}

export type BrandData = {
  name: string;
  fullName: string;
  domain: string;
  logo: string;
  fullLogo: string;
  logoHasBg: boolean;
  colors: string[];
  fonts: string[];
  images: string[];
  logos: Array<{
    url: string;
    hasBg: boolean;
    isLight?: boolean;
    score: number;
  }>;
};
