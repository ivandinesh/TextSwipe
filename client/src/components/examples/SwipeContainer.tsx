import { SwipeContainer } from '../SwipeContainer';

export default function SwipeContainerExample() {
  //todo: remove mock functionality
  const mockSnippets = [
    "JavaScript uses prototypal inheritance, which means objects can inherit directly from other objects without needing classes.",
    "The 'this' keyword in JavaScript refers to the object that is executing the current function. Its value can change depending on how the function is called.",
    "Arrow functions don't have their own 'this' binding. They inherit 'this' from the enclosing scope, making them great for callbacks.",
    "Closures allow functions to access variables from their outer scope even after the outer function has returned.",
    "The event loop handles asynchronous operations in JavaScript by using a call stack, callback queue, and event loop mechanism."
  ];

  return (
    <div className="h-screen">
      <SwipeContainer
        snippets={mockSnippets}
        topic="JavaScript Basics"
        onBack={() => console.log('Back button pressed')}
        onLike={(content) => console.log('Liked content:', content.substring(0, 50) + '...')}
      />
    </div>
  );
}