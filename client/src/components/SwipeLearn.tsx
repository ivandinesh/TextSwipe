import { useState } from "react";
import { TopicInput } from "./TopicInput";
import { SwipeContainer } from "./SwipeContainer";
import { LoadingScreen } from "./LoadingScreen";

//todo: remove mock functionality
const DEMO_CONTENT: Record<string, string[]> = {
  "python basics": [
    "Python is an interpreted, high-level programming language known for its readable syntax and versatility.",
    "Variables in Python don't need type declarations. You can simply assign values: name = 'Alice', age = 25.",
    "Python uses indentation to define code blocks instead of curly braces. This makes code more readable and consistent.",
    "Lists in Python are ordered, changeable collections: fruits = ['apple', 'banana', 'cherry'].",
    "Python's 'for' loops can iterate over any sequence: for fruit in fruits: print(fruit)."
  ],
  "italian recipes": [
    "Authentic Italian pasta should be cooked 'al dente' - firm to the bite, usually 1-2 minutes less than package directions.",
    "The key to perfect risotto is gradually adding warm broth while stirring constantly to release the rice's starch.",
    "Pizza dough needs to rest for at least 24 hours in the refrigerator for the best flavor and texture.",
    "Real Carbonara uses only eggs, Pecorino Romano, guanciale, and black pepper - no cream or peas!",
    "Italian tomato sauce is simple: San Marzano tomatoes, garlic, basil, and good olive oil. Less is more."
  ],
  "space facts": [
    "A day on Venus is longer than its year. Venus rotates so slowly that one day (243 Earth days) exceeds its orbital period (225 Earth days).",
    "The largest volcano in our solar system is Olympus Mons on Mars, standing about 21 kilometers (13 miles) high.",
    "One teaspoon of neutron star material would weigh about 6 billion tons on Earth due to its incredible density.",
    "The International Space Station travels at approximately 28,000 km/h (17,500 mph) and orbits Earth every 90 minutes.",
    "Saturn's moon Titan has lakes and rivers of liquid methane and ethane, making it one of the most Earth-like worlds we know."
  ],
  "photography tips": [
    "The rule of thirds: Divide your frame into 9 sections and place important elements along these lines or at their intersections.",
    "Golden hour occurs one hour after sunrise and one hour before sunset, providing soft, warm light perfect for portraits.",
    "A lower f-stop number (like f/1.8) creates a shallow depth of field, blurring the background to make your subject pop.",
    "ISO controls your camera's sensitivity to light. Higher ISO allows shooting in darker conditions but may add grain.",
    "Leading lines guide the viewer's eye through your photo. Use roads, rivers, or architectural elements to create visual flow."
  ]
};

export function SwipeLearn() {
  const [currentView, setCurrentView] = useState<'input' | 'loading' | 'learning'>('input');
  const [currentTopic, setCurrentTopic] = useState('');
  const [learningSnippets, setLearningSnippets] = useState<string[]>([]);
  const [likedSnippets, setLikedSnippets] = useState<string[]>([]);

  const handleTopicSubmit = async (topic: string, mode: 'ai' | 'demo') => {
    console.log('Topic submitted:', topic, 'Mode:', mode);
    setCurrentTopic(topic);
    setCurrentView('loading');

    try {
      if (mode === 'demo') {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find matching demo content or use default
        const normalizedTopic = topic.toLowerCase();
        let snippets = DEMO_CONTENT[normalizedTopic];
        
        if (!snippets) {
          // If no exact match, use a generic set based on topic keywords
          if (normalizedTopic.includes('python') || normalizedTopic.includes('programming')) {
            snippets = DEMO_CONTENT["python basics"];
          } else if (normalizedTopic.includes('cook') || normalizedTopic.includes('recipe')) {
            snippets = DEMO_CONTENT["italian recipes"];
          } else if (normalizedTopic.includes('space') || normalizedTopic.includes('astronomy')) {
            snippets = DEMO_CONTENT["space facts"];
          } else if (normalizedTopic.includes('photo')) {
            snippets = DEMO_CONTENT["photography tips"];
          } else {
            // Fallback to Python basics
            snippets = DEMO_CONTENT["python basics"];
          }
        }
        
        setLearningSnippets(snippets);
      } else {
        // AI mode - placeholder for now
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLearningSnippets([
          "AI-generated content would appear here when OpenAI API key is configured.",
          "This feature requires backend integration with OpenAI's API.",
          "For now, try Demo Mode to see the full learning experience!",
        ]);
      }
      
      setCurrentView('learning');
    } catch (error) {
      console.error('Error loading content:', error);
      // Fallback to demo content
      setLearningSnippets(DEMO_CONTENT["python basics"]);
      setCurrentView('learning');
    }
  };

  const handleBack = () => {
    setCurrentView('input');
    setCurrentTopic('');
    setLearningSnippets([]);
    console.log('Returned to topic selection');
  };

  const handleLike = (content: string) => {
    const updatedLiked = likedSnippets.includes(content) 
      ? likedSnippets.filter(snippet => snippet !== content)
      : [...likedSnippets, content];
    
    setLikedSnippets(updatedLiked);
    
    // Store in localStorage
    localStorage.setItem('swipelearn-liked', JSON.stringify(updatedLiked));
    console.log('Updated liked snippets:', updatedLiked.length);
  };

  // Load liked snippets on mount
  useState(() => {
    const saved = localStorage.getItem('swipelearn-liked');
    if (saved) {
      try {
        setLikedSnippets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading liked snippets:', error);
      }
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'input' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8 max-w-md">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              SwipeLearn
            </h1>
            <p className="text-muted-foreground text-lg">
              Learn like you scroll. Swipe through bite-sized lessons designed for the mobile generation.
            </p>
          </div>
          
          <TopicInput onSubmit={handleTopicSubmit} />
          
          {likedSnippets.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {likedSnippets.length} snippet{likedSnippets.length !== 1 ? 's' : ''} liked
              </p>
            </div>
          )}
        </div>
      )}
      
      {currentView === 'loading' && (
        <LoadingScreen 
          message={`Creating amazing ${currentTopic} lessons just for you...`} 
        />
      )}
      
      {currentView === 'learning' && (
        <SwipeContainer
          snippets={learningSnippets}
          topic={currentTopic}
          onBack={handleBack}
          onLike={handleLike}
        />
      )}
    </div>
  );
}