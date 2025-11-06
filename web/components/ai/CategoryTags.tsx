/**
 * CategoryTags Component
 * Displays message categories and themes extracted by AI.
 */

import React from 'react';

export interface CategoryTagsProps {
  primaryCategory: string;
  secondaryCategories?: string[];
  themes?: Array<{ name: string; relevance: number }>;
  showConfidence?: boolean;
  maxTags?: number;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({
  primaryCategory,
  secondaryCategories = [],
  themes = [],
  showConfidence = true,
  maxTags = 5,
}) => {
  const allTags = [
    { name: primaryCategory, type: 'primary', relevance: 1.0 },
    ...secondaryCategories.map((cat) => ({ name: cat, type: 'secondary', relevance: 0.8 })),
    ...themes.slice(0, maxTags - 1 - secondaryCategories.length).map((t) => ({
      name: t.name,
      type: 'theme',
      relevance: t.relevance,
    })),
  ].slice(0, maxTags);

  const getTagColor = (type: string): string => {
    switch (type) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'secondary':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'theme':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTagLabel = (type: string): string => {
    switch (type) {
      case 'primary':
        return 'Category';
      case 'secondary':
        return 'Tag';
      case 'theme':
        return 'Theme';
      default:
        return 'Tag';
    }
  };

  if (!primaryCategory) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border rounded-full ${getTagColor(
            tag.type,
          )}`}
          title={`${getTagLabel(tag.type)}: ${tag.name}${
            showConfidence && tag.relevance < 1.0
              ? ` (${Math.round(tag.relevance * 100)}% relevance)`
              : ''
          }`}
        >
          {tag.type === 'primary' && <span>📌</span>}
          {tag.type === 'secondary' && <span>#</span>}
          {tag.type === 'theme' && <span>💡</span>}
          <span>{tag.name}</span>
          {showConfidence && tag.relevance < 1.0 && (
            <span className="opacity-70">({Math.round(tag.relevance * 100)}%)</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default CategoryTags;
