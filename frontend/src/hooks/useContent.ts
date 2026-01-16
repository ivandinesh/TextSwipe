import { useInfiniteQuery } from '@tanstack/react-query';

interface Card {
  content: string;
}

interface LearningSnippetsResponse {
  cards: Card[];
  nextPrevious?: string;
}

export function useLearningContent(topic: string) {
  const fetchSnippets = async ({ pageParam }: { pageParam?: string }) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        previousSnippet: pageParam
      }),
      credentials: 'include' // For auth cookies
    });

    if (!response.ok) {
      throw new Error('Failed to fetch learning snippets');
    }

    return response.json() as Promise<LearningSnippetsResponse>;
  };

  return useInfiniteQuery<LearningSnippetsResponse, Error>({
    queryKey: ['learning-snippets', topic],
    queryFn: ({ pageParam }) => fetchSnippets({ pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Use the last snippet as continuation token for next page
      return lastPage.nextPrevious;
    },
    getPreviousPageParam: () => undefined, // No backward pagination
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.message.includes('400') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}
```

Now let me create the deployment script:{"display_description": "Create deployment script", "path": "TextSwipe/deploy_infinite_cards_fix.sh", "mode": "create"}
