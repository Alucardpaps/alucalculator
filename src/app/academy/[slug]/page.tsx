import React from 'react';
import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { AcademyArticle } from '@/schemas/academy-article';
import { getAcademyPage } from '@/locales/academyPageTranslations';
import { AcademyArticleView } from '@/components/academy/AcademyArticleView';
import { AcademyArticleNotFound } from '@/components/academy/AcademyArticleNotFound';
import { AcademySeoGuideView } from '@/components/academy/AcademySeoGuideView';
import {
  findSeoCalculatorBySlug,
  getSeoGuideSlugsExcludingArticles,
  seoCalculatorToLessonViewModel,
} from '@/lib/academySeoLesson';

const DATA_DIR = path.join(process.cwd(), 'src/data/academy-articles');

async function getArticleSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(DATA_DIR);
    return files.filter((f) => f.endsWith('.json')).map((file) => file.replace('.json', ''));
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const articleSlugs = await getArticleSlugs();
  const seoSlugs = getSeoGuideSlugsExcludingArticles(articleSlugs);
  return [...articleSlugs, ...seoSlugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: AcademyArticle = JSON.parse(fileContent);

    return {
      title: data.meta.title,
      description: data.meta.description,
      alternates: {
        canonical: `https://www.alucalculator.com/academy/${slug}`,
      },
      openGraph: {
        title: data.meta.title,
        description: data.meta.description,
        type: 'article',
      },
    };
  } catch {
    const seoCalc = findSeoCalculatorBySlug(slug);
    if (seoCalc) {
      return {
        title: seoCalc.meta.title,
        description: seoCalc.meta.description,
        alternates: {
          canonical: `https://www.alucalculator.com/academy/${slug}`,
        },
        openGraph: {
          title: seoCalc.meta.title,
          description: seoCalc.meta.description,
          type: 'article',
        },
      };
    }
    const chrome = getAcademyPage('en');
    return {
      title: `${chrome.articleNotFound} | AluCalc Academy`,
      description: chrome.articleNotFound,
    };
  }
}

export default async function AcademyArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: AcademyArticle | null = null;

  try {
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch {
    // Fall through to SEO guide lookup
  }

  if (data) {
    return <AcademyArticleView slug={slug} data={data} />;
  }

  const seoCalc = findSeoCalculatorBySlug(slug);
  if (seoCalc) {
    const lesson = seoCalculatorToLessonViewModel(seoCalc);
    return <AcademySeoGuideView slug={slug} lesson={lesson} />;
  }

  return <AcademyArticleNotFound />;
}
