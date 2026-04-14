export interface SeoPageMetadata {
    title: string;
    description: string;
}

export interface SeoPageContent {
    h1: string;
    intro: string;
    formula: string;
    variables: Record<string, string>;
    step_by_step: string;
    practical: string;
    example: string;
}

export interface CtaConfig {
    label: string;
    link: string;
}

export interface SeoCalculatorPage {
    id: string;
    title: string;
    slug: string;
    keyword: string;
    intent: string;
    meta: SeoPageMetadata;
    seo: SeoPageContent;
    related: string[];
    cta: CtaConfig;
}
