import { TopicInput } from '../TopicInput';

export default function TopicInputExample() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <TopicInput
        onSubmit={(topic, mode) => console.log('Topic submitted:', topic, 'Mode:', mode)}
        isLoading={false}
      />
    </div>
  );
}