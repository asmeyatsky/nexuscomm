import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SentimentBadge from '@/components/ai/SentimentBadge';

describe('SentimentBadge', () => {
  describe('rendering', () => {
    it('should render positive sentiment badge', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.95}
          size="md"
          showConfidence={true}
        />,
      );

      expect(screen.getByText(/Positive/i)).toBeInTheDocument();
      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('(95%)')).toBeInTheDocument();
    });

    it('should render neutral sentiment badge', () => {
      render(
        <SentimentBadge
          sentiment="neutral"
          confidence={0.5}
          size="md"
          showConfidence={true}
        />,
      );

      expect(screen.getByText(/Neutral/i)).toBeInTheDocument();
      expect(screen.getByText('😐')).toBeInTheDocument();
      expect(screen.getByText('(50%)')).toBeInTheDocument();
    });

    it('should render negative sentiment badge', () => {
      render(
        <SentimentBadge
          sentiment="negative"
          confidence={0.8}
          size="md"
          showConfidence={true}
        />,
      );

      expect(screen.getByText(/Negative/i)).toBeInTheDocument();
      expect(screen.getByText('😞')).toBeInTheDocument();
      expect(screen.getByText('(80%)')).toBeInTheDocument();
    });
  });

  describe('confidence display', () => {
    it('should show confidence percentage when showConfidence is true', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.75}
          showConfidence={true}
        />,
      );

      expect(screen.getByText('(75%)')).toBeInTheDocument();
    });

    it('should hide confidence percentage when showConfidence is false', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.95}
          showConfidence={false}
        />,
      );

      expect(screen.queryByText(/\(\d+%\)/)).not.toBeInTheDocument();
    });

    it('should use default showConfidence as true', () => {
      render(<SentimentBadge sentiment="positive" confidence={0.85} />);

      expect(screen.getByText('(85%)')).toBeInTheDocument();
    });

    it('should round confidence percentage correctly', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.856}
          showConfidence={true}
        />,
      );

      expect(screen.getByText('(86%)')).toBeInTheDocument();
    });

    it('should handle 0 confidence', () => {
      render(
        <SentimentBadge sentiment="neutral" confidence={0} showConfidence={true} />,
      );

      expect(screen.getByText('(0%)')).toBeInTheDocument();
    });

    it('should handle 100% confidence', () => {
      render(
        <SentimentBadge sentiment="positive" confidence={1} showConfidence={true} />,
      );

      expect(screen.getByText('(100%)')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} size="sm" />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} size="md" />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-sm');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} size="lg" />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-2');
      expect(badge).toHaveClass('text-base');
    });

    it('should use medium size as default', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('px-3');
    });
  });

  describe('color styling', () => {
    it('should apply positive sentiment colors', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
      expect(badge).toHaveClass('border-green-300');
    });

    it('should apply negative sentiment colors', () => {
      const { container } = render(
        <SentimentBadge sentiment="negative" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
      expect(badge).toHaveClass('border-red-300');
    });

    it('should apply neutral sentiment colors', () => {
      const { container } = render(
        <SentimentBadge sentiment="neutral" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-800');
      expect(badge).toHaveClass('border-gray-300');
    });

    it('should apply border and rounded-full classes', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('emojis', () => {
    it('should display correct emoji for positive sentiment', () => {
      render(<SentimentBadge sentiment="positive" confidence={0.8} />);
      expect(screen.getByText('😊')).toBeInTheDocument();
    });

    it('should display correct emoji for negative sentiment', () => {
      render(<SentimentBadge sentiment="negative" confidence={0.8} />);
      expect(screen.getByText('😞')).toBeInTheDocument();
    });

    it('should display correct emoji for neutral sentiment', () => {
      render(<SentimentBadge sentiment="neutral" confidence={0.8} />);
      expect(screen.getByText('😐')).toBeInTheDocument();
    });
  });

  describe('text formatting', () => {
    it('should capitalize sentiment text', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.8}
          showConfidence={false}
        />,
      );

      expect(screen.getByText('Positive')).toBeInTheDocument();
    });

    it('should display sentiment text regardless of input case', () => {
      const { rerender } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} showConfidence={false} />,
      );

      expect(screen.getByText('Positive')).toBeInTheDocument();

      rerender(
        <SentimentBadge sentiment="negative" confidence={0.8} showConfidence={false} />,
      );

      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });

  describe('title/tooltip', () => {
    it('should have title attribute with sentiment and confidence', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.95} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveAttribute(
        'title',
        expect.stringContaining('Positive sentiment'),
      );
      expect(badge).toHaveAttribute('title', expect.stringContaining('95%'));
    });

    it('should include confidence in title for all sentiments', () => {
      const sentiments: Array<'positive' | 'neutral' | 'negative'> = [
        'positive',
        'neutral',
        'negative',
      ];

      for (const sentiment of sentiments) {
        const { container } = render(
          <SentimentBadge sentiment={sentiment} confidence={0.8} />,
        );

        const badge = container.querySelector('div');
        expect(badge).toHaveAttribute('title', expect.stringContaining('80%'));
        expect(badge).toHaveAttribute('title', expect.stringContaining('sentiment'));
      }
    });
  });

  describe('layout and structure', () => {
    it('should have flex layout with gap', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('gap-2');
    });

    it('should be bold font weight', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('font-medium');
    });

    it('should have inline-flex display', () => {
      const { container } = render(
        <SentimentBadge sentiment="positive" confidence={0.8} />,
      );

      const badge = container.querySelector('div');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('confidence opacity', () => {
    it('should apply opacity-70 to confidence text', () => {
      const { container } = render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.8}
          showConfidence={true}
        />,
      );

      const spans = container.querySelectorAll('span');
      const confidenceSpan = Array.from(spans).find((span) =>
        span.textContent?.includes('%'),
      );

      expect(confidenceSpan).toHaveClass('opacity-70');
    });
  });

  describe('edge cases', () => {
    it('should handle very low confidence', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.01}
          showConfidence={true}
        />,
      );

      expect(screen.getByText('(1%)')).toBeInTheDocument();
    });

    it('should handle very high confidence', () => {
      render(
        <SentimentBadge
          sentiment="positive"
          confidence={0.999}
          showConfidence={true}
        />,
      );

      expect(screen.getByText('(100%)')).toBeInTheDocument();
    });

    it('should render multiple badges independently', () => {
      const { container } = render(
        <div>
          <SentimentBadge sentiment="positive" confidence={0.9} />
          <SentimentBadge sentiment="negative" confidence={0.8} />
          <SentimentBadge sentiment="neutral" confidence={0.7} />
        </div>,
      );

      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('😞')).toBeInTheDocument();
      expect(screen.getByText('😐')).toBeInTheDocument();
    });
  });
});
