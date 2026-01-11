import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TopicInput } from "./TopicInput";
import { SwipeContainer } from "./SwipeContainer";
import { LoadingScreen } from "./LoadingScreen";

interface DemoContent {
  [key: string]: string[];
}



export function SwipeLearn() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentView, setCurrentView] = useState<
    "input" | "loading" | "learning"
  >(() => {
    // Check URL params for initial state
    const params = new URLSearchParams(location.search);
    return params.get('view') === 'learning' ? 'learning' : 'input';
  });
  const [currentTopic, setCurrentTopic] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('topic') || "";
  });
  const [learningSnippets, setLearningSnippets] = useState<string[]>([]);
  const [likedSnippets, setLikedSnippets] = useState<string[]>([]);

  const handleTopicSubmit = async (topic: string) => {
    console.log("Topic submitted:", topic);
    setCurrentTopic(topic);
    setCurrentView("loading");
    // Update URL with topic and view state
    navigate(`?view=learning&topic=${encodeURIComponent(topic)}`);

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
        } else {
          throw new Error(data.error || "Failed to generate content");
        }

      setCurrentView("learning");
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
    // Update URL to reflect current state
    navigate('?', { replace: true });
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
          onTopicChange={(newTopic) => {
            setCurrentTopic(newTopic);
            // Update URL with new topic
            navigate(`?view=learning&topic=${encodeURIComponent(newTopic)}`);
          }}
        />
      )}
    </div>
  );
}
