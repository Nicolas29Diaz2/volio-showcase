/**
 * Hexagonal Port: AI Provider Interface
 *
 * Defines the contract for multimodal AI reasoning providers (e.g., Google Gemini,
 * OpenRouter, Anthropic) without coupling domain logic to any specific vendor SDK.
 */
export interface NarrativeBrief {
  title: string;
  theme: string;
  narrativeArc: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  pages: Array<{
    pageIndex: number;
    headline: string;
    subheadline?: string;
    bodyText?: string;
    quote?: string;
    suggestedAssetQueries: string[];
  }>;
}

export interface StructuredPageLayout {
  pageIndex: number;
  layoutType: 'HERO' | 'SPLIT_HORIZONTAL' | 'COLLAGE_3' | 'EDITORIAL_QUOTE';
  elements: Array<{
    type: 'IMAGE' | 'TEXT' | 'HEADING' | 'BADGE';
    tailwindClasses: string;
    content?: string;
    assetUrl?: string;
  }>;
}

export interface IAIProvider {
  /**
   * Generates a high-level creative and narrative brief based on user prompt & photos.
   */
  generateNarrativeBrief(
    prompt: string,
    photoUrls: string[],
    context?: Record<string, unknown>,
  ): Promise<NarrativeBrief>;

  /**
   * Transforms narrative brief and collected assets into structured page layouts.
   */
  generateStructuredLayouts(
    brief: NarrativeBrief,
    availableAssets: string[],
  ): Promise<StructuredPageLayout[]>;
}
