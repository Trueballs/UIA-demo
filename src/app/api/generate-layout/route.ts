// src/app/api/generate-layout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LLMLayoutResponse, BrandData } from '@/types/llm-layout';

/**
 * POST /api/generate-layout
 * 
 * LLM Art Director endpoint
 * Input: brandData, userText, imageDescription
 * Output: Dynamic layout tokens and content positioning
 * 
 * Currently mocked for testing. Replace with actual LLM call (OpenAI, Claude, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandData, userText, imageDescription } = body;

    if (!brandData || !userText) {
      return NextResponse.json(
        { error: 'Missing required fields: brandData, userText' },
        { status: 400 }
      );
    }

    // 🔮 MOCK LLM RESPONSE (replace with real LLM call)
    // For now, return a deterministic response based on brand domain
    const mockResponse = generateMockLayout(brandData, userText, imageDescription);

    return NextResponse.json({
      success: true,
      data: mockResponse,
    });
  } catch (error) {
    console.error('Layout generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate layout' },
      { status: 500 }
    );
  }
}

/**
 * Mock LLM layout generator
 * In production, this would call Claude/OpenAI with system prompt about LinkedIn safe zones
 */
function generateMockLayout(
  brandData: BrandData,
  userText: string,
  imageDescription?: string
): LLMLayoutResponse {
  // Determine layout based on number of colors (simple heuristic)
  const colorCount = brandData.colors?.length || 1;
  const layoutMap: Record<number, "L0" | "L1" | "L2" | "L3" | "L4" | "L5"> = {
    1: "L1",
    2: "L2",
    3: "L3",
    4: "L4",
    5: "L5",
  };
  const selectedLayout = layoutMap[Math.min(colorCount, 5)] || "L1";

  // Generate content based on text length
  const headline = userText.length > 0 ? userText : `Join ${brandData.name}`;
  const subtext = imageDescription || `Discover excellence at ${brandData.name}`;

  // Safe zone positioning based on selected layout
  const positioningMap: Record<string, string> = {
    L0: "left-[32px] bottom-[42px]",           // Zone Bottom-Left (Tight)
    L1: "left-[600px] bottom-[48px]",          // Zone Right (Safe)
    L2: "right-[40px] top-[32px]",             // Zone Right + Top
    L3: "left-[600px] top-1/2 -translate-y-1/2", // Zone Center
    L4: "right-[48px] bottom-[60px]",          // Zone Right + Bottom
    L5: "left-[600px] bottom-[40px]",          // Zone Right + Bottom
  };

  const textPositioning = positioningMap[selectedLayout] || "left-[600px] bottom-[42px]";

  return {
    selected_base_layout: selectedLayout,
    reasoning: `Selected ${selectedLayout} based on ${brandData.name}'s brand color palette (${colorCount} colors). This layout maximizes text visibility while respecting LinkedIn's avatar danger zone.`,
    content: {
      headline,
      subtext,
      call_to_action: `Explore ${brandData.name}`,
    },
    design_tokens: {
      text_positioning: textPositioning,
      text_alignment: "text-left",
      max_width: "max-w-[520px]",
      color_theme: determineBrandTheme(brandData.colors),
    },
    logo_config: {
      placement: "top-right",
      use_glass_panel: !brandData.logoHasBg,
    },
  };
}

/**
 * Determine if brand should use dark, light, or brand color theme
 */
function determineBrandTheme(
  colors: string[]
): "dark" | "light" | "brand" {
  if (!colors || colors.length === 0) return "brand";

  // Simple heuristic: check primary color luminance
  const primaryColor = colors[0];
  const luminance = getLuminance(primaryColor);

  if (luminance > 200) return "light";
  if (luminance < 100) return "dark";
  return "brand";
}

/**
 * Calculate perceived luminance of a hex color
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
