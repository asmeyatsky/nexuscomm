export interface MessageAnalysis {
  messageId: string;
  sentiment: string;
  score: number;
  categories: MessageCategory[];
}

export interface MessageCategory {
  primary: string;
  confidence: number;
}

export function useAIAnalysis(messageId: string) {
  return {
    analysis: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
