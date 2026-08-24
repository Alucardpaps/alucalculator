export interface AcademyArticle {
    slug: string;
    academicYear: 1 | 2 | 3 | 4;
    department: 'Mechanical' | 'Materials' | 'Structural' | 'Thermodynamics' | 'Manufacturing' | 'General';
    difficulty: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
    readingTime: number; // in minutes
    isMasterClass?: boolean;
    prerequisites: string[]; // slugs of other articles
    meta: {
        title: string;
        description: string;
    };
    hero: {
        h1: string;
        intro: string; // 150-300 words
    };
    learningObjectives?: string[];
    keyTakeaways?: string[];
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
    textbookInsights?: Array<{ page: string; insight: string; source: string }>;
    downloadableResources?: Array<{ title: string; filename: string }>;
}
