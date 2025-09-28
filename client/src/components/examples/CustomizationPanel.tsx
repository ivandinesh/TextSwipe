import { CustomizationPanel } from '../CustomizationPanel';

export default function CustomizationPanelExample() {
  return (
    <div className="h-screen bg-background">
      <CustomizationPanel
        isOpen={true}
        onClose={() => console.log('Customization panel closed')}
        onBackgroundChange={(color) => console.log('Background changed to:', color)}
        onFontChange={(font) => console.log('Font changed to:', font)}
      />
    </div>
  );
}