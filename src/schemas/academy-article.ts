export interface AcademyArticle {
    slug: string;
    meta: {
        title: string;
        description: string;
    };
    hero: {
        h1: string;
        intro: string; // 150-300 words
    };
    formula: {
        equation: string;
        variables: Record<string, string>;
    };
    stepByStep: string[];
    example: {
        inputs: string[];
        calculation: string;
    };
    whyThisMatters: string[];
    commonMistakes: string[];
    engineeringTip?: string;
    calculatorCta: {
        targetSlug: string; // matches calculator slug
        label: string;
    };
    faq: Array<{ question: string; answer: string }>;
    relatedArticles: string[];
}
