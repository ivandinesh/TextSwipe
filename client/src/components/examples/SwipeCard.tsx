import { SwipeCard } from '../SwipeCard';

export default function SwipeCardExample() {
  const sampleContent = "JavaScript uses prototypal inheritance, which means objects can inherit directly from other objects without needing classes.";

  return (
    <div className="h-screen bg-background">
      <SwipeCard
        content={sampleContent}
        index={0}
        total={5}
        isActive={true}
        onNext={() => console.log('Next card requested')}
        onPrevious={() => console.log('Previous card requested')}
        onLike={(content) => console.log('Liked:', content)}
      />
    </div>
  );
}