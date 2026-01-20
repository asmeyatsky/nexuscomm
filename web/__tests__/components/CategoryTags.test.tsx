import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CategoryTags from '@/components/ai/CategoryTags';

describe('CategoryTags', () => {
  describe('rendering', () => {
    it('should render primary category tag', () => {
      render(<CategoryTags primaryCategory="Project Management" />);

      expect(screen.getByText('Project Management')).toBeInTheDocument();
      expect(screen.getByText('📌')).toBeInTheDocument();
    });

    it('should return null if no primary category provided', () => {
      const { container } = render(
        <CategoryTags primaryCategory="" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render secondary categories with hashtag icon', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Urgent', 'Follow-up']}
        />,
      );

      expect(screen.getAllByText('#')).toHaveLength(2);
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('Follow-up')).toBeInTheDocument();
    });

    it('should render themes with lightbulb icon', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          themes={[
            { name: 'Innovation', relevance: 0.9 },
            { name: 'Collaboration', relevance: 0.85 },
          ]}
        />,
      );

      expect(screen.getAllByText('💡')).toHaveLength(2);
      expect(screen.getByText('Innovation')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
    });

    it('should render combination of all tag types', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary1']}
          themes={[{ name: 'Theme1', relevance: 0.9 }]}
        />,
      );

      expect(screen.getByText('📌')).toBeInTheDocument(); // primary
      expect(screen.getByText('#')).toBeInTheDocument(); // secondary
      expect(screen.getByText('💡')).toBeInTheDocument(); // theme
    });
  });

  describe('tag colors', () => {
    it('should apply blue color to primary category', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Primary" />,
      );

      const primaryTag = container.querySelector('span[class*="bg-blue"]');
      expect(primaryTag).toHaveClass('bg-blue-100');
      expect(primaryTag).toHaveClass('text-blue-800');
      expect(primaryTag).toHaveClass('border-blue-300');
    });

    it('should apply purple color to secondary categories', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary']}
        />,
      );

      const tags = container.querySelectorAll('span[class*="bg-"]');
      const secondaryTag = Array.from(tags).find((tag) =>
        tag.className.includes('bg-purple'),
      );

      expect(secondaryTag).toHaveClass('bg-purple-100');
      expect(secondaryTag).toHaveClass('text-purple-800');
      expect(secondaryTag).toHaveClass('border-purple-300');
    });

    it('should apply indigo color to themes', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.9 }]}
        />,
      );

      const tags = container.querySelectorAll('span[class*="bg-"]');
      const themeTag = Array.from(tags).find((tag) =>
        tag.className.includes('bg-indigo'),
      );

      expect(themeTag).toHaveClass('bg-indigo-100');
      expect(themeTag).toHaveClass('text-indigo-800');
      expect(themeTag).toHaveClass('border-indigo-300');
    });
  });

  describe('maxTags limit', () => {
    it('should limit tags to maxTags (default 5)', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Sec1', 'Sec2', 'Sec3', 'Sec4', 'Sec5']}
          themes={[
            { name: 'Theme1', relevance: 0.9 },
            { name: 'Theme2', relevance: 0.8 },
            { name: 'Theme3', relevance: 0.7 },
          ]}
        />,
      );

      const tags = container.querySelectorAll('span[class*="px-3"]');
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it('should respect custom maxTags value', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Sec1', 'Sec2', 'Sec3']}
          themes={[
            { name: 'Theme1', relevance: 0.9 },
            { name: 'Theme2', relevance: 0.8 },
          ]}
          maxTags={3}
        />,
      );

      const tags = container.querySelectorAll('span[class*="px-3"]');
      expect(tags.length).toBeLessThanOrEqual(3);
    });

    it('should prioritize primary category first', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Primary"
          secondaryCategories={['Sec1', 'Sec2']}
          maxTags={2}
        />,
      );

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Sec1')).toBeInTheDocument();
      expect(screen.queryByText('Sec2')).not.toBeInTheDocument();
    });
  });

  describe('relevance display', () => {
    it('should show relevance for secondary categories when showConfidence is true', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary']}
          showConfidence={true}
        />,
      );

      // Secondary categories have default relevance of 0.8
      const secondaryTag = Array.from(
        container.querySelectorAll('span[title*="relevance"]'),
      ).find((tag) => tag.textContent?.includes('Secondary'));

      expect(secondaryTag).toHaveAttribute('title', expect.stringContaining('80%'));
    });

    it('should show relevance for themes when showConfidence is true', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Innovation', relevance: 0.92 }]}
          showConfidence={true}
        />,
      );

      const themeTag = Array.from(
        container.querySelectorAll('span[title*="relevance"]'),
      ).find((tag) => tag.textContent?.includes('Innovation'));

      expect(themeTag).toHaveAttribute('title', expect.stringContaining('92%'));
    });

    it('should not show relevance when showConfidence is false', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary']}
          showConfidence={false}
        />,
      );

      const tags = Array.from(container.querySelectorAll('span'));
      const relevanceTags = tags.filter((tag) =>
        tag.textContent?.includes('%'),
      );

      expect(relevanceTags.length).toBe(0);
    });

    it('should use default showConfidence as true', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.85 }]}
        />,
      );

      const themeTag = Array.from(
        container.querySelectorAll('span[title*="relevance"]'),
      ).find((tag) => tag.textContent?.includes('Theme'));

      expect(themeTag).toHaveAttribute('title', expect.stringContaining('85%'));
    });

    it('should round relevance percentage correctly', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.856 }]}
          showConfidence={true}
        />,
      );

      const themeTag = Array.from(
        container.querySelectorAll('span[title*="relevance"]'),
      ).find((tag) => tag.textContent?.includes('Theme'));

      expect(themeTag).toHaveAttribute('title', expect.stringContaining('86%'));
    });

    it('should not show relevance for primary category (always 1.0)', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Primary"
          showConfidence={true}
        />,
      );

      const primaryTag = Array.from(
        container.querySelectorAll('span[title*="Category"]'),
      ).find((tag) => tag.textContent?.includes('Primary'));

      // Primary category has 100% relevance, so it should not show relevance in title
      expect(primaryTag?.getAttribute('title')).not.toContain('relevance');
    });
  });

  describe('tag styles', () => {
    it('should have inline-flex layout', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      const tags = container.querySelectorAll('span[class*="inline-flex"]');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should have gap between icon and text', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      const tag = container.querySelector('span[class*="gap-"]');
      expect(tag).toHaveClass('gap-1');
    });

    it('should have padding and rounded appearance', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      const tag = container.querySelector('span[class*="px-"]');
      expect(tag).toHaveClass('px-3');
      expect(tag).toHaveClass('py-1');
      expect(tag).toHaveClass('rounded-full');
    });

    it('should be extra small text size', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      const tag = container.querySelector('span[class*="text-xs"]');
      expect(tag).toHaveClass('text-xs');
    });

    it('should have medium font weight', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      const tag = container.querySelector('span[class*="font-"]');
      expect(tag).toHaveClass('font-medium');
    });
  });

  describe('container layout', () => {
    it('should have flex wrapping container', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Sec1', 'Sec2']}
        />,
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-wrap');
      expect(wrapper).toHaveClass('gap-2');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined secondaryCategories', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should handle undefined themes', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Main" />,
      );

      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should handle empty arrays', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={[]}
          themes={[]}
        />,
      );

      const tags = container.querySelectorAll('span[class*="px-3"]');
      expect(tags.length).toBe(1); // Only primary category
    });

    it('should handle very long category names', () => {
      const longName = 'A'.repeat(100);
      const { container } = render(
        <CategoryTags primaryCategory={longName} />,
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle relevance value of 1.0', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 1.0 }]}
          showConfidence={true}
        />,
      );

      const themeTag = Array.from(
        container.querySelectorAll('span'),
      ).find((tag) => tag.textContent?.includes('Theme'));

      expect(themeTag).toHaveAttribute('title', expect.stringContaining('100%'));
    });

    it('should handle relevance value of 0.0', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.0 }]}
          showConfidence={true}
        />,
      );

      const themeTag = Array.from(
        container.querySelectorAll('span'),
      ).find((tag) => tag.textContent?.includes('Theme'));

      expect(themeTag).toHaveAttribute('title', expect.stringContaining('0%'));
    });

    it('should handle multiple tags with mixed relevance', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Sec1', 'Sec2']}
          themes={[
            { name: 'Theme1', relevance: 0.95 },
            { name: 'Theme2', relevance: 0.5 },
          ]}
          showConfidence={true}
        />,
      );

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Sec1')).toBeInTheDocument();
      expect(screen.getByText('Theme1')).toBeInTheDocument();
      expect(screen.getByText('Theme2')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should display category icon for primary', () => {
      render(<CategoryTags primaryCategory="Primary" />);
      expect(screen.getByText('📌')).toBeInTheDocument();
    });

    it('should display hashtag for secondary', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary']}
        />,
      );
      expect(screen.getByText('#')).toBeInTheDocument();
    });

    it('should display lightbulb for themes', () => {
      render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.9 }]}
        />,
      );
      expect(screen.getByText('💡')).toBeInTheDocument();
    });
  });

  describe('title attributes', () => {
    it('should have descriptive title for primary category', () => {
      const { container } = render(
        <CategoryTags primaryCategory="Primary" />,
      );

      const primaryTag = container.querySelector('span[title*="Category"]');
      expect(primaryTag).toHaveAttribute('title', expect.stringContaining('Primary'));
    });

    it('should have descriptive title for secondary category', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          secondaryCategories={['Secondary']}
        />,
      );

      const secondaryTag = container.querySelector('span[title*="Tag"]');
      expect(secondaryTag).toHaveAttribute('title', expect.stringContaining('Secondary'));
    });

    it('should have descriptive title for theme', () => {
      const { container } = render(
        <CategoryTags
          primaryCategory="Main"
          themes={[{ name: 'Theme', relevance: 0.9 }]}
        />,
      );

      const themeTag = container.querySelector('span[title*="Theme"]');
      expect(themeTag).toHaveAttribute('title', expect.stringContaining('Theme'));
    });
  });
});
