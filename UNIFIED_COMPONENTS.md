# 🎨 Unified Component System

## Overview

The Unified Component System provides consistent, reusable UI components with standardized design patterns across your entire application. All components follow the same design principles with unified:

- **Font sizes and typography**
- **Padding and spacing**  
- **Hover animations and transitions**
- **Border radius and shadows**
- **Color schemes and variants**
- **Form layouts and validation**

## 🔘 Button Components

### Basic Button
```jsx
import { Button } from '@/components/ui/design-system-components';

// Primary button
<Button variant="primary" size="md">
  Click me
</Button>

// With icon
<Button variant="primary" icon={<Plus className="w-4 h-4" />}>
  Add Item
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>
```

### Button Variants
- `primary` - Main action button (blue)
- `secondary` - Secondary action (green)  
- `outline` - Outlined button
- `ghost` - Transparent button
- `destructive` - Delete/remove actions (red)
- `success` - Success actions (green)
- `warning` - Warning actions (yellow)

### Button Sizes
- `xs` - Extra small (28px height)
- `sm` - Small (32px height) 
- `md` - Medium (40px height) - *Default*
- `lg` - Large (48px height)
- `xl` - Extra large (56px height)

### Icon Button
```jsx
import { IconButton } from '@/components/ui/design-system-components';

<IconButton variant="primary" size="md">
  <Edit className="w-4 h-4" />
</IconButton>
```

## 🃏 Card Components

### Basic Card Structure
```jsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/design-system-components';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Card Variants
- `default` - Standard card with subtle shadow
- `elevated` - Enhanced shadow for emphasis
- `outlined` - Bordered card without shadow
- `ghost` - Minimal styling with background

### Card Features
- **Consistent spacing**: All cards use the same padding (24px)
- **Hover effects**: Subtle lift animation on hover
- **Typography hierarchy**: Proper heading and text sizing
- **Border consistency**: Unified border radius (12px)

## 📝 Form Components

### Form Container
```jsx
import { FormContainer } from '@/components/ui/design-system-components';

<FormContainer 
  title="Form Title"
  description="Form description"
>
  {/* Form content */}
</FormContainer>
```

### Form Layout Components
```jsx
import { 
  FormSection, 
  FormGrid, 
  FormField 
} from '@/components/ui/design-system-components';

<FormSection 
  title="Section Title"
  description="Section description"
>
  <FormGrid columns={2} gap="md">
    <FormField 
      label="Field Label" 
      required
      error={errors.field}
      description="Helper text"
    >
      <Input placeholder="Enter value" />
    </FormField>
  </FormGrid>
</FormSection>
```

### Input Components
```jsx
import { Input, Textarea, Select } from '@/components/ui/design-system-components';

// Text Input
<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={hasError}
  size="md"
/>

// Textarea
<Textarea
  placeholder="Enter description"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
  error={hasError}
/>

// Select
<Select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Select option"
  error={hasError}
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

### Form Alerts
```jsx
import { FormAlert } from '@/components/ui/design-system-components';

<FormAlert variant="success" title="Success!">
  Form submitted successfully
</FormAlert>

<FormAlert variant="error" title="Error">
  Please fix the following errors
</FormAlert>

<FormAlert variant="warning" title="Warning">
  Please review before proceeding
</FormAlert>

<FormAlert variant="info" title="Information">
  Additional helpful information
</FormAlert>
```

## 🎯 Design System Features

### Consistent Animations
- **Button hover**: Subtle lift effect (-2px transform)
- **Card hover**: Smooth shadow transition  
- **Focus states**: Ring outline with brand colors
- **Loading states**: Smooth spinner animation

### Unified Spacing Scale
- Form padding: `24px` (1.5rem)
- Button padding: `12px 16px` (0.75rem 1rem)  
- Input padding: `8px 12px` (0.5rem 0.75rem)
- Grid gaps: `12px`, `16px`, `24px`, `32px`

### Typography Hierarchy
- **Card titles**: `text-xl font-semibold` (20px)
- **Form labels**: `text-sm font-medium` (14px)
- **Helper text**: `text-sm text-neutral-500` (14px)
- **Error text**: `text-sm text-error-600` (14px)

### Color System Integration
All components use the design system's color variables:
- Primary: Blue tones for main actions
- Secondary: Green tones for secondary actions  
- Error: Red tones for validation and destructive actions
- Success: Green tones for positive feedback
- Warning: Yellow tones for caution
- Neutral: Gray tones for text and borders

## 📱 Responsive Design

### Mobile-First Approach
- Touch-friendly button sizes (minimum 44px height)
- Stacked form layouts on mobile
- Larger tap targets for better usability

### Breakpoint Behavior
- **Mobile**: Single column forms, smaller buttons
- **Tablet**: Two-column forms, medium buttons  
- **Desktop**: Multi-column forms, full button sizes

### Grid System
```jsx
// Responsive grid columns
<FormGrid columns={1}>        {/* Always 1 column */}
<FormGrid columns={2}>        {/* 1 on mobile, 2 on tablet+ */}
<FormGrid columns={3}>        {/* 1 on mobile, 2 on tablet, 3 on desktop */}
<FormGrid columns={4}>        {/* 1 on mobile, 2 on tablet, 4 on desktop */}
```

## 🔄 Migration Guide

### From Old Components

**Before:**
```jsx
// Old inconsistent styling
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
  Click me
</button>

<div className="bg-white shadow-lg rounded-lg p-6">
  <h3 className="text-lg font-bold">Title</h3>
  <p>Content</p>
</div>
```

**After:**
```jsx
// New unified components
<Button variant="primary" size="md">
  Click me
</Button>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

### Import Changes
```jsx
// Replace multiple imports
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// With single import
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
  FormField 
} from '@/components/ui/design-system-components';
```

## 🚀 Benefits

### Developer Experience
- **Consistent API**: All components follow the same prop patterns
- **TypeScript support**: Full type safety and autocompletion
- **Storybook integration**: Interactive component documentation
- **Reduced bundle size**: Optimized component tree-shaking

### Design Consistency  
- **Unified spacing**: No more guessing margins and padding
- **Color harmony**: Automatic color scheme compliance
- **Animation consistency**: Same transitions across all components
- **Accessibility**: Built-in ARIA labels and keyboard navigation

### Maintenance Benefits
- **Single source of truth**: Change once, update everywhere
- **Easy theming**: Modify CSS variables to rebrand
- **Version control**: Track design changes systematically  
- **Testing**: Easier unit and integration testing

## 📖 Examples

See `src/components/UnifiedComponentsShowcase.jsx` for a comprehensive example of all components in action.

See `src/pages/AddPlayerUnified.jsx` for a real-world form implementation using the unified system.

## 🔧 Customization

### Custom Variants
```jsx
// Extend button variants in unified-components.jsx
const variants = {
  // ... existing variants
  custom: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500'
};
```

### Custom Sizes
```jsx
// Add new sizes
const sizes = {
  // ... existing sizes  
  '2xl': 'h-16 px-10 text-2xl rounded-2xl min-w-[8rem]'
};
```

### Theme Overrides
```css
/* In your CSS */
:root {
  --primary-500: your-custom-blue;
  --secondary-500: your-custom-green;
  /* ... other color overrides */
}
```
