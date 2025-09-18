# SquadUp Design System

A comprehensive design system built with TailwindCSS and custom CSS variables for consistent, scalable, and maintainable UI components.

## 🎨 Color Palette

### Primary Colors
- **Primary 50**: `#f0f9ff` - Lightest blue
- **Primary 500**: `#0ea5e9` - Main primary color
- **Primary 900**: `#0c4a6e` - Darkest blue

### Secondary Colors
- **Secondary 50**: `#f0fdfa` - Lightest teal
- **Secondary 500**: `#14b8a6` - Main secondary color
- **Secondary 900**: `#134e4a` - Darkest teal

### Neutral Colors
- **Neutral 50**: `#f8fafc` - Lightest gray
- **Neutral 500**: `#64748b` - Medium gray
- **Neutral 900**: `#0f172a` - Darkest gray

### Semantic Colors
- **Success**: `#22c55e` - Green for success states
- **Warning**: `#f59e0b` - Orange for warnings
- **Error**: `#ef4444` - Red for errors
- **Info**: `#3b82f6` - Blue for information

## 📝 Typography

### Font Families
- **Sans**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`
- **Mono**: `'JetBrains Mono', 'Fira Code', 'Monaco'`
- **Display**: `'Inter', -apple-system, BlinkMacSystemFont`

### Font Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **5xl**: `3rem` (48px)

### Font Weights
- **thin**: 100
- **light**: 300
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700
- **extrabold**: 800

## 📏 Spacing Scale

Based on 4px increments:
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **4**: `1rem` (16px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **24**: `6rem` (96px)
- **32**: `8rem` (128px)

## 🔲 Border Radius

- **sm**: `0.125rem` (2px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **3xl**: `1.5rem` (24px)
- **full**: `9999px`

## 🌟 Shadows

### Standard Shadows
- **xs**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **sm**: `0 1px 3px 0 rgb(0 0 0 / 0.1)`
- **md**: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- **lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- **xl**: `0 20px 25px -5px rgb(0 0 0 / 0.1)`

### Glow Effects
- **glow**: `0 0 20px rgb(14 165 233 / 0.3)`
- **glow-secondary**: `0 0 20px rgb(45 212 191 / 0.3)`
- **glow-success**: `0 0 20px rgb(34 197 94 / 0.3)`

## 📱 Responsive Breakpoints

- **sm**: `640px` - Small tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Small desktops
- **xl**: `1280px` - Large desktops
- **2xl**: `1536px` - Extra large screens

## 🧩 Component Library

### Buttons

```jsx
// Primary Button
<Button variant="primary" size="md">
  Click me
</Button>

// Secondary Button
<Button variant="secondary" size="lg">
  Secondary Action
</Button>

// Outline Button
<Button variant="outline" size="sm">
  Cancel
</Button>
```

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `warning`
**Sizes**: `sm`, `md`, `lg`, `xl`

### Inputs

```jsx
// Text Input
<Input 
  type="text" 
  placeholder="Enter text"
  error={errors.field}
  size="md"
/>

// Textarea
<Textarea 
  placeholder="Enter description"
  error={errors.description}
  size="lg"
/>
```

**Sizes**: `sm`, `md`, `lg`
**States**: `error`, `disabled`, `focus`

### Cards

```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badges

```jsx
<Badge variant="primary" size="md">
  New
</Badge>
```

**Variants**: `default`, `primary`, `secondary`, `success`, `warning`, `error`, `outline`
**Sizes**: `sm`, `md`, `lg`

### Alerts

```jsx
<Alert variant="success">
  <CheckCircle className="w-4 h-4" />
  <Text>Success message</Text>
</Alert>
```

**Variants**: `default`, `success`, `warning`, `error`, `info`

## 🎯 Usage Guidelines

### Color Usage
- **Primary**: Use for main actions, links, and important elements
- **Secondary**: Use for secondary actions and accents
- **Neutral**: Use for text, borders, and backgrounds
- **Semantic**: Use for status indicators and feedback

### Typography Hierarchy
1. **Display**: Large headings and hero text
2. **Heading 1-6**: Section and subsection titles
3. **Body**: Regular text content
4. **Caption**: Small text and labels

### Spacing
- Use the 4px-based spacing scale consistently
- Maintain visual rhythm with consistent spacing
- Use larger spacing for section separation

### Responsive Design
- Mobile-first approach
- Test on all breakpoints
- Use responsive utility classes
- Consider touch targets (minimum 44px)

## 🔧 Customization

### CSS Variables
All design tokens are defined as CSS variables in `src/styles/design-system.css`:

```css
:root {
  --primary-500: #0ea5e9;
  --secondary-500: #14b8a6;
  --space-4: 1rem;
  --text-lg: 1.125rem;
}
```

### Tailwind Configuration
The design system is integrated with TailwindCSS in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: 'var(--primary-500)',
          // ... other shades
        }
      }
    }
  }
}
```

## 📚 Best Practices

### Component Development
1. Use design system tokens consistently
2. Follow the established patterns
3. Test across all breakpoints
4. Ensure accessibility compliance
5. Document component props and usage

### Styling
1. Prefer TailwindCSS utility classes
2. Use CSS variables for custom values
3. Follow the mobile-first approach
4. Maintain consistent spacing and typography
5. Use semantic color names

### Performance
1. Minimize custom CSS
2. Use utility classes efficiently
3. Optimize for mobile performance
4. Consider CSS-in-JS for dynamic styles

## 🚀 Getting Started

1. Import the design system components:
```jsx
import { Button, Card, Input } from '@/components/ui/design-system-components';
```

2. Use TailwindCSS classes:
```jsx
<div className="bg-primary-500 text-white p-4 rounded-lg">
  Content
</div>
```

3. Apply responsive classes:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Content
</div>
```

## 📖 Examples

### Form Layout
```jsx
<Card>
  <CardHeader>
    <CardTitle>Add New Player</CardTitle>
  </CardHeader>
  <CardContent>
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Full Name
          </label>
          <Input 
            type="text" 
            placeholder="Enter name"
            error={errors.name}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Position
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forward">Forward</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### Dashboard Layout
```jsx
<div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
  <div className="flex">
    <Sidebar className="w-sidebar bg-white border-r">
      {/* Sidebar content */}
    </Sidebar>
    <div className="flex-1">
      <header className="h-header bg-white border-b">
        {/* Header content */}
      </header>
      <main className="p-6">
        <Container size="xl">
          {/* Main content */}
        </Container>
      </main>
    </div>
  </div>
</div>
```

This design system provides a solid foundation for building consistent, accessible, and responsive user interfaces across the SquadUp application.
