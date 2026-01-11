# Instruction Modal System

## Overview

The instruction modal system provides a guided tour for new users and allows existing users to review app features. It consists of:

- **InstructionModal**: Reusable modal component
- **useInstructions**: Hook for managing modal state
- **instructionData.ts**: Configurable instruction content
- **instructionUtils**: Utility functions for localStorage management

## Features

- ✅ Shows automatically on first app visit
- ✅ Stores state in localStorage
- ✅ Accessible via "Help" button in sidebar
- ✅ Responsive design with optional images
- ✅ Progress indicator and step navigation
- ✅ Skip functionality for first-time users

## Usage

### Automatic First-Time Display
The modal automatically shows for new users through the `Layout` component.

### Manual Trigger
Users can access instructions via the "Help" button in the sidebar.

### Custom Implementation
```tsx
import { useInstructions } from '@/hooks/useInstructions';
import InstructionModal from '@/components/InstructionModal';

function MyComponent() {
  const { showInstructions, openInstructions, closeInstructions } = useInstructions();

  return (
    <>
      <button onClick={openInstructions}>Show Help</button>
      <InstructionModal
        isOpen={showInstructions}
        onClose={closeInstructions}
        showOnFirstVisit={false}
      />
    </>
  );
}
```

## Customization

### Adding New Steps
Edit `frontend/src/data/instructionData.ts`:

```typescript
export const instructionSteps: InstructionStep[] = [
  {
    header: "New Feature",
    body: "Description of the new feature...",
    image: "/images/instructions/new-feature.png" // Optional
  },
  // ... existing steps
];
```

### Styling
The modal uses Tailwind CSS and matches your app's design system. Key classes:
- Responsive grid layout for image/text content
- Smooth transitions and animations
- Consistent button styling with your Button component

### Images
- Place images in `frontend/public/images/instructions/`
- Recommended: 800x450px (16:9 aspect ratio)
- Images are optional - modal adapts automatically

## Utility Functions

```typescript
import { instructionUtils } from '@/utils/instructionUtils';

// Check if user has seen instructions
instructionUtils.hasSeenInstructions();

// Reset for testing
instructionUtils.resetInstructionState();

// Force show on next load
instructionUtils.forceShowInstructions();
```

## Integration Points

1. **Layout Component**: Handles first-time display
2. **Navigation Component**: Provides "Help" button access
3. **localStorage**: Persists user preference
4. **Responsive Design**: Works on mobile and desktop