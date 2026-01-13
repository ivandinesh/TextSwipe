import { useState, useEffect } from "react";
import { useTopicService } from "@/services/topicService";
import { TopicInput } from "./TopicInput";
import { SwipeContainer } from "./SwipeContainer";
import { LoadingScreen } from "./LoadingScreen";

interface DemoContent {
  [key: string]: string[];
}

// Demo content for fallback when API fails
const DEMO_CONTENT: DemoContent = {
  "python basics": [
    "Python is a high-level, interpreted programming language.",
    "It was created by Guido van Rossum and first released in 1991.",
    "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
    "It has a large standard library and extensive third-party support through the Python Package Index (PyPI).",
    "Python's syntax emphasizes readability and uses indentation for code blocks.",
    "It's widely used in web development, data science, machine learning, and automation."
  ],
  "javascript basics": [
    "JavaScript is a versatile programming language used for web development.",
    "It runs in web browsers and can also be used on servers with Node.js.",
    "JavaScript supports both procedural and object-oriented programming styles.",
    "Modern JavaScript includes features like arrow functions, classes, and modules.",
    "It's essential for creating interactive web pages and web applications.",
    "JavaScript has a large ecosystem with frameworks like React, Vue, and Angular."
  ]
};



export function FocusFeed() {
  const topicService = useTopicService();
  const [currentView, setCurrentView] = useState<
    "input" | "loading" | "learning"
  >("input");
  const [currentTopic, setCurrentTopic] = useState("");
  const [learningSnippets, setLearningSnippets] = useState<string[]>([]);
  const [likedSnippets, setLikedSnippets] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const index = params.get('index');
    return index ? parseInt(index) || 0 : 0;
  });

  // Check URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const topic = params.get('topic');
    const index = params.get('index');

    if (view === 'learning' && topic) {
      // Restore from URL
      setCurrentView("loading");
      setCurrentTopic(topic);

      // Fetch content for this topic
      const fetchContent = async () => {
        try {
          const response = await fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              count: 5,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.snippets) {
              setLearningSnippets(data.snippets);
              setCurrentView("learning");
              // Restore the specific card index if provided
              if (index) {
                setCurrentIndex(parseInt(index) || 0);
              }
            }
          }
        } catch (error) {
          console.error("Error restoring from URL:", error);
          setCurrentView("input");
        }
      };

      fetchContent();
    }
  }, []);

  // Check URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const topic = params.get('topic');
    const index = params.get('index');

    if (view === 'learning' && topic) {
      // Restore from URL
      setCurrentView("loading");
      setCurrentTopic(topic);

      // Fetch content for this topic
      const fetchContent = async () => {
        try {
          const response = await fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              count: 5,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.snippets) {
              setLearningSnippets(data.snippets);
              setCurrentView("learning");
              // Restore the specific card index if provided
              if (index) {
                setCurrentIndex(parseInt(index) || 0);
              }
            }
          }
        } catch (error) {
          console.error("Error restoring from URL:", error);
          setCurrentView("input");
        }
      };

      fetchContent();
    }
  }, []);

  const handleTopicSubmit = async (topic: string) => {
    console.log("Topic submitted:", topic);
    setCurrentTopic(topic);
    setCurrentView("loading");

    try {
        // AI mode - call backend API
        const response = await fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            count: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.snippets) {
          setLearningSnippets(data.snippets);
          setCurrentView("learning");
          // Update URL to preserve state on refresh (start at first card)
          window.history.pushState(
            { view: 'learning', topic, index: 0 },
            '',
            `?view=learning&topic=${encodeURIComponent(topic)}&index=0`
          );
        } else {
          throw new Error(data.error || "Failed to generate content");
        }
      setCurrentView("learning");
      // Update URL to preserve state on refresh
      window.history.pushState(
        { view: 'learning', topic, index: 0 },
        '',
        `?view=learning&topic=${encodeURIComponent(topic)}&index=0`
      );
    } catch (error) {
      console.error("Error loading content:", error);
      // Show error message but still provide fallback content
      const errorSnippet = "⚠️ Could not generate content. Please check your connection and try again.";
      // Fallback to demo content with error message
      const fallbackSnippets = [
        errorSnippet,
        ...DEMO_CONTENT["python basics"].slice(1),
      ];
      setLearningSnippets(fallbackSnippets);
      setCurrentView("learning");
    }
  };

  const handleBack = () => {
    setCurrentView("input");
    setCurrentTopic("");
    setLearningSnippets([]);
    setCurrentIndex(0);
    // Update URL to reflect current state
    window.history.pushState(
      { view: 'input', index: 0 },
      '',
      '?view=input&index=0'
    );
    console.log("Returned to topic selection");
  };

  const handleTopicChange = async (newTopic: string) => {
    console.log("Handling topic change to:", newTopic);
    setCurrentTopic(newTopic);
    setCurrentView("loading");

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic, count: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.snippets) {
          setLearningSnippets(data.snippets);
          setCurrentView("learning");
          console.log("Successfully generated content for new topic:", newTopic);
        } else {
          throw new Error(data.error || "Failed to generate content");
        }
      } else {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error changing topic:", error);
      setCurrentView("input");
    }
  };

  const handleLike = (content: string) => {
    const updatedLiked = likedSnippets.includes(content)
      ? likedSnippets.filter((snippet) => snippet !== content)
      : [...likedSnippets, content];

    setLikedSnippets(updatedLiked);

    // Store in localStorage
    localStorage.setItem('focusfeed-liked', JSON.stringify(updatedLiked));

    // Track like in topic service
    const isLiked = !likedSnippets.includes(content);
    topicService.trackTopicLike(currentTopic, isLiked);

    console.log('Updated liked snippets:', updatedLiked.length);
  };

  // Load liked snippets on mount
  useEffect(() => {
    const saved = localStorage.getItem('focusfeed-liked');
    if (saved) {
      try {
        setLikedSnippets(JSON.parse(saved));
        console.log(
          "Loaded liked snippets from localStorage:",
          JSON.parse(saved).length,
        );
      } catch (error) {
        console.error("Error loading liked snippets:", error);
      }
    }
  }, []);

  // Add window popstate event listener for browser navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.view === 'learning' && event.state.topic) {
          setCurrentView("learning");
          setCurrentTopic(event.state.topic);
          if (event.state.index !== undefined) {
            setCurrentIndex(event.state.index);
          }
          // You might want to refetch content here if needed
        } else {
          setCurrentView("input");
          setCurrentIndex(0);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {currentView === "input" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8 max-w-md">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              FocusFeed
            </h1>
            <p className="text-muted-foreground text-lg">
              Focus like never before. Dive into curated knowledge feeds designed
              to help you concentrate and learn efficiently.
            </p>
          </div>

          <TopicInput onSubmit={handleTopicSubmit} />

          {likedSnippets.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {likedSnippets.length} snippet
                {likedSnippets.length !== 1 ? "s" : ""} liked
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === "loading" && (
        <LoadingScreen
          message={`Creating amazing ${currentTopic} lessons just for you...`}
        />
      )}

      {currentView === "learning" && (
        <SwipeContainer
          snippets={learningSnippets}
          topic={currentTopic}
          mode="ai"
          onBack={handleBack}
          onLike={handleLike}
          onTopicChange={handleTopicChange}
          currentTopic={currentTopic}
        />
      )}
    </div>
  );
}
