import { logger } from '../utils/logger';

interface ValidationResult {
  valid: boolean;
  inTrends: boolean;
  inTags: boolean;
  warning?: string;
  suggestions?: string[];
}

/**
 * Validate keyword consistency across the triple index:
 * Title + Tags + Visual
 */
export function validateKeywordConsistency(
  chapterKeyword: string,
  establishedTrends: string[],
  seoTags: string[]
): ValidationResult {
  const keywordLower = chapterKeyword.toLowerCase().trim();

  const inTrends = establishedTrends.some((trend) => {
    const trendLower = trend.toLowerCase();
    return (
      trendLower.includes(keywordLower) ||
      keywordLower.includes(trendLower) ||
      calculateSimilarity(keywordLower, trendLower) > 0.7
    );
  });

  const inTags = seoTags.some((tag) => {
    const tagLower = tag.toLowerCase();
    return (
      tagLower.includes(keywordLower) ||
      keywordLower.includes(tagLower) ||
      calculateSimilarity(keywordLower, tagLower) > 0.7
    );
  });

  if (inTrends && inTags) {
    return { valid: true, inTrends, inTags };
  }

  if (!inTrends && !inTags) {
    const allKeywords = [...establishedTrends, ...seoTags];
    const suggestions = findSimilarKeywords(keywordLower, allKeywords, 3);

    return {
      valid: false,
      inTrends,
      inTags,
      warning: `Keyword "${chapterKeyword}" not found in trends or tags. Consider using: ${suggestions.join(', ')}`,
      suggestions,
    };
  }

  return {
    valid: true,
    inTrends,
    inTags,
    warning: inTrends
      ? `Keyword "${chapterKeyword}" found in trends but not in tags`
      : `Keyword "${chapterKeyword}" found in tags but not in trends`,
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function findSimilarKeywords(
  target: string,
  candidates: string[],
  limit: number
): string[] {
  return candidates
    .map((candidate) => ({
      keyword: candidate,
      similarity: calculateSimilarity(target, candidate.toLowerCase()),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.keyword);
}

export function validateAllChapterKeywords(
  chapters: Array<{ keyword: string; title: string }>,
  establishedTrends: string[],
  seoTags: string[],
  projectId: string
): { allValid: boolean; results: ValidationResult[] } {
  const results: ValidationResult[] = [];
  let allValid = true;

  for (const chapter of chapters) {
    const result = validateKeywordConsistency(chapter.keyword, establishedTrends, seoTags);
    results.push(result);

    if (!result.valid) {
      allValid = false;
      logger.warn('Chapter keyword validation failed', {
        projectId,
        keyword: chapter.keyword,
        warning: result.warning,
      });
    }
  }

  return { allValid, results };
}
