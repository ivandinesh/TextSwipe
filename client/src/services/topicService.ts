/**
 * Topic Service - Hybrid storage for popular topics
 * Uses localStorage as primary storage, can be extended to use PostgreSQL in production
 */

// Type definitions
interface TopicInteraction {
  topic: string;
  timestamp: number;
  count: number;
  isLiked: boolean;
}

interface TopicService {
  getPopularTopics: (limit?: number) => string[];
  trackTopicSelection: (topic: string) => void;
  trackTopicLike: (topic: string, isLiked: boolean) => void;
  getUserTopics: () => TopicInteraction[];
  syncWithServer: () => Promise<void>;
  initialize: () => void;
}

// Local storage keys
const LOCAL_STORAGE_KEYS = {
  TOPIC_INTERACTIONS: 'focusfeed-topic-interactions',
  LAST_SYNC: 'focusfeed-last-sync',
  USER_ID: 'focusfeed-user-id'
};

// Generate a simple user ID for local identification
const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
};

// Default popular topics (fallback)
const DEFAULT_POPULAR_TOPICS = [
  "Quantum Computing", "Neuroplasticity", "Dark Matter", "Biohacking",
  "Blockchain", "AI Ethics", "Space Colonization", "Cryptography",
  "Genetic Engineering", "Renewable Energy", "Consciousness", "Time Dilation",
  "Artificial Intelligence", "Climate Science", "Psychology", "Philosophy",
  "Economics", "Astronomy", "Biology", "Chemistry", "Mathematics",
  "Literature", "Music Theory", "Film Studies", "Architecture", "Design Thinking"
];

// Topic Service Implementation
export const createTopicService = (): TopicService => {
  const userId = getOrCreateUserId();

  // Initialize topic interactions from localStorage
  const initialize = () => {
    const storedInteractions = localStorage.getItem(LOCAL_STORAGE_KEYS.TOPIC_INTERACTIONS);
    if (!storedInteractions) {
      // Initialize with some default interactions to seed the popular topics
      const initialInteractions: TopicInteraction[] = DEFAULT_POPULAR_TOPICS.map(topic => ({
        topic,
        timestamp: Date.now() - Math.floor(Math.random() * 1000000000), // Random past timestamp
        count: 1,
        isLiked: false
      }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOPIC_INTERACTIONS, JSON.stringify(initialInteractions));
    }
  };

  // Get all topic interactions for the current user
  const getUserTopics = (): TopicInteraction[] => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.TOPIC_INTERACTIONS);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error parsing topic interactions:", error);
      return [];
    }
  };

  // Save topic interactions back to localStorage
  const saveUserTopics = (interactions: TopicInteraction[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOPIC_INTERACTIONS, JSON.stringify(interactions));
  };

  // Get popular topics based on user interactions
  const getPopularTopics = (limit = 12): string[] => {
    const interactions = getUserTopics();

    if (interactions.length === 0) {
      return DEFAULT_POPULAR_TOPICS.slice(0, limit);
    }

    // Sort by: liked status (first), then count (most popular), then recency
    const sorted = [...interactions].sort((a, b) => {
      // Liked topics come first
      if (a.isLiked !== b.isLiked) return a.isLiked ? -1 : 1;
      // Then by count (popularity)
      if (a.count !== b.count) return b.count - a.count;
      // Then by recency
      return b.timestamp - a.timestamp;
    });

    return sorted.slice(0, limit).map(interaction => interaction.topic);
  };

  // Track when a user selects a topic
  const trackTopicSelection = (topic: string) => {
    const interactions = getUserTopics();
    const existingIndex = interactions.findIndex(t => t.topic === topic);

    if (existingIndex >= 0) {
      // Update existing interaction
      interactions[existingIndex] = {
        ...interactions[existingIndex],
        timestamp: Date.now(),
        count: interactions[existingIndex].count + 1
      };
    } else {
      // Add new interaction
      interactions.push({
        topic,
        timestamp: Date.now(),
        count: 1,
        isLiked: false
      });
    }

    saveUserTopics(interactions);

    // Try to sync with server if in production
    if (process.env.NODE_ENV === 'production') {
      syncWithServer().catch(error => {
        console.warn("Failed to sync with server, will retry later:", error);
      });
    }
  };

  // Track when a user likes/unlikes a topic
  const trackTopicLike = (topic: string, isLiked: boolean) => {
    const interactions = getUserTopics();
    const existingIndex = interactions.findIndex(t => t.topic === topic);

    if (existingIndex >= 0) {
      // Update existing interaction
      interactions[existingIndex] = {
        ...interactions[existingIndex],
        isLiked
      };
    } else {
      // Add new interaction if topic wasn't tracked before
      interactions.push({
        topic,
        timestamp: Date.now(),
        count: 1,
        isLiked
      });
    }

    saveUserTopics(interactions);

    // Sync with server if in production
    if (process.env.NODE_ENV === 'production') {
      syncWithServer().catch(error => {
        console.warn("Failed to sync with server, will retry later:", error);
      });
    }
  };

  // Sync local data with server (PostgreSQL in production)
  const syncWithServer = async () => {
    try {
      // Check if we should sync (not too frequently)
      const lastSync = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC);
      if (lastSync && Date.now() - parseInt(lastSync) < 300000) { // 5 minutes
        return;
      }

      const interactions = getUserTopics();

      // Only sync if we have data
      if (interactions.length === 0) return;

      const response = await fetch('/api/topic-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          interactions,
          timestamp: Date.now()
        }),
      });

      if (response.ok) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        console.log('Successfully synced topic interactions with server');
      } else {
        console.warn('Failed to sync topic interactions with server');
      }
    } catch (error) {
      console.error('Error syncing topic interactions:', error);
      // Could implement retry logic here
    }
  };

  // Fetch popular topics from server (if available)
  const fetchServerPopularTopics = async (): Promise<string[] | null> => {
    try {
      const response = await fetch(`/api/popular-topics?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.topics || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching popular topics from server:', error);
      return null;
    }
  };

  return {
    getPopularTopics,
    trackTopicSelection,
    trackTopicLike,
    getUserTopics,
    syncWithServer,
    initialize
  };
};

// Singleton instance
let topicServiceInstance: TopicService | null = null;

export const getTopicService = (): TopicService => {
  if (!topicServiceInstance) {
    topicServiceInstance = createTopicService();
    topicServiceInstance.initialize();
  }
  return topicServiceInstance;
};

// Hook for React components
export const useTopicService = () => {
  const service = getTopicService();
  return service;
};
