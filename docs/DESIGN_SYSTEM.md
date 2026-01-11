# Squad Up Design System

**Project:** Squad Up - Youth Soccer Management System  
**Framework:** React + Tailwind CSS + shadcn/ui  
**Last Updated:** January 2026  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Accessibility](#accessibility)
8. [Usage Guidelines](#usage-guidelines)
9. [Dark Mode](#dark-mode)

---

## 🎨 Introduction

This design system defines the visual language and component library for Squad Up. It ensures consistency across the application and provides clear guidelines for designers and developers.

### Design Philosophy

- ✅ **Consistency** - Uniform look and feel across all features
- ✅ **Accessibility** - WCAG 2.1 AA compliant
- ✅ **Responsive** - Mobile-first design approach
- ✅ **Performance** - Optimized for speed and efficiency
- ✅ **Flexibility** - Adaptable to different contexts

### Tech Stack

- **UI Framework:** React 18
- **CSS Framework:** Tailwind CSS 3.x
- **Component Library:** shadcn/ui (60+ components)
- **Icons:** Lucide React
- **Animations:** tailwindcss-animate

---

## 🎯 Design Principles

### 1. Clarity Over Complexity
Keep interfaces simple and focused. Every element should serve a clear purpose.

### 2. Consistency is Key
Use established patterns and components. Don't reinvent the wheel.

### 3. Responsive by Default
Design for mobile first, enhance for larger screens.

### 4. Accessible Always
Ensure keyboard navigation, screen reader support, and sufficient contrast.

### 5. Performance Matters
Optimize for fast load times and smooth interactions.

---

## 🎨 COLOR SYSTEM

### Semantic Colors

Colors are defined using CSS variables for theme support (light/dark mode).

#### **Primary Colors**

**Primary** - Main brand color, used for primary actions
- Token: `bg-primary`, `text-primary`
- HSL Light: `0 0% 9%` (Near black)
- HSL Dark: `0 0% 98%` (Near white)
- Usage: Primary buttons, key UI elements

**Primary Foreground** - Text on primary backgrounds
- Token: `text-primary-foreground`
- HSL Light: `0 0% 98%`
- HSL Dark: `0 0% 9%`

---

#### **Secondary Colors**

**Secondary** - Secondary actions and highlights
- Token: `bg-secondary`, `text-secondary`
- HSL Light: `0 0% 96.1%` (Light gray)
- HSL Dark: `0 0% 14.9%` (Dark gray)
- Usage: Secondary buttons, less prominent elements

**Secondary Foreground**
- Token: `text-secondary-foreground`
- HSL Light: `0 0% 9%`

---

#### **State Colors**

**Destructive** - Errors, warnings, dangerous actions
- Token: `bg-destructive`, `text-destructive`
- HSL: `0 84.2% 60.2%` (Red)
- Usage: Delete buttons, error messages, red cards

**Destructive Foreground**
- Token: `text-destructive-foreground`
- HSL: `0 0% 98%`

**Muted** - Disabled or less important content
- Token: `bg-muted`, `text-muted`
- HSL Light: `0 0% 96.1%`
- Usage: Disabled inputs, secondary text

**Muted Foreground**
- Token: `text-muted-foreground`
- HSL Light: `0 0% 45.1%` (Mid gray)

**Accent** - Highlights and hover states
- Token: `bg-accent`, `text-accent-foreground`
- HSL Light: `0 0% 96.1%`
- Usage: Hover states, subtle highlights

---

#### **UI Colors**

**Background** - Main application background
- Token: `bg-background`
- HSL Light: `0 0% 100%` (White)
- HSL Dark: `0 0% 3.9%` (Near black)

**Foreground** - Main text color
- Token: `text-foreground`
- HSL Light: `0 0% 3.9%`
- HSL Dark: `0 0% 98%`

**Card** - Card backgrounds
- Token: `bg-card`
- HSL Light: `0 0% 100%`
- HSL Dark: `0 0% 3.9%`

**Border** - Border color
- Token: `border-border`
- HSL Light: `0 0% 89.8%` (Light gray)
- HSL Dark: `0 0% 14.9%` (Dark gray)

**Input** - Input field borders
- Token: `border-input`
- HSL Light: `0 0% 89.8%`
- HSL Dark: `0 0% 14.9%`

**Ring** - Focus ring color
- Token: `ring-ring`
- HSL Light: `0 0% 3.9%`
- HSL Dark: `0 0% 83.1%`

---

### Brand Colors

Full spectrum colors for specific use cases (e.g., team colors, status indicators).

#### **Brand Blue** - Professional, trustworthy
```
50:  hsl(239, 100%, 97%)  - Lightest
100: hsl(239, 100%, 93%)
200: hsl(239, 100%, 87%)
300: hsl(239, 100%, 78%)
400: hsl(239, 100%, 67%)
500: hsl(239, 84%, 67%)   - Default (bg-brand-blue)
600: hsl(239, 84%, 60%)
700: hsl(239, 84%, 53%)
800: hsl(239, 84%, 46%)
900: hsl(239, 84%, 39%)
950: hsl(239, 84%, 25%)   - Darkest
```

**Usage:** Primary team colors, links, informational messages

---

#### **Brand Yellow** - Energy, optimism
```
50:  hsl(48, 100%, 96%)   - Lightest
500: hsl(38, 92%, 50%)    - Default (bg-brand-yellow)
950: hsl(21, 92%, 14%)    - Darkest
```

**Usage:** Yellow cards, warnings, highlights

---

#### **Brand Green** - Success, growth
```
50:  hsl(151, 81%, 96%)   - Lightest
500: hsl(160, 84%, 39%)   - Default (bg-brand-green)
950: hsl(166, 91%, 9%)    - Darkest
```

**Usage:** Success messages, goals scored, positive stats

---

#### **Brand Red** - Attention, urgency
```
50:  hsl(0, 86%, 97%)     - Lightest
500: hsl(0, 84%, 60%)     - Default (bg-brand-red)
950: hsl(0, 75%, 15%)     - Darkest
```

**Usage:** Red cards, errors, negative stats, goals conceded

---

#### **Brand Purple** - Creativity, premium
```
50:  hsl(270, 100%, 98%)  - Lightest
500: hsl(271, 91%, 65%)   - Default (bg-brand-purple)
950: hsl(274, 87%, 21%)   - Darkest
```

**Usage:** Special features, premium content

---

#### **Brand Orange** - Action, excitement
```
50:  hsl(33, 100%, 96%)   - Lightest
500: hsl(25, 95%, 53%)    - Default (bg-brand-orange)
950: hsl(15, 80%, 13%)    - Darkest
```

**Usage:** Substitutions, action indicators

---

### Chart Colors

Pre-defined colors for data visualization:

- **Chart 1:** `hsl(12, 76%, 61%)` - Coral
- **Chart 2:** `hsl(173, 58%, 39%)` - Teal
- **Chart 3:** `hsl(197, 37%, 24%)` - Navy
- **Chart 4:** `hsl(43, 74%, 66%)` - Gold
- **Chart 5:** `hsl(27, 87%, 67%)` - Orange

**Usage:** Analytics charts, statistics visualization

---

### Color Usage Guidelines

#### ✅ Do:
- Use semantic tokens (`bg-primary`, `text-destructive`) instead of raw colors
- Maintain sufficient contrast ratios (4.5:1 for text, 3:1 for UI elements)
- Use brand colors for team identification and status indicators
- Test colors in both light and dark modes

#### ❌ Don't:
- Use hardcoded hex colors in components
- Mix semantic and brand colors without reason
- Use low-contrast color combinations
- Override theme colors without using CSS variables

---

## ✍️ TYPOGRAPHY

### Font Family

**Default:** System font stack for optimal performance

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;
```

### Type Scale

| Name | Tailwind Class | Size | Line Height | Weight | Usage |
|------|---------------|------|-------------|--------|-------|
| **Heading 1** | `text-4xl` | 2.25rem (36px) | 2.5rem | 700 | Page titles |
| **Heading 2** | `text-3xl` | 1.875rem (30px) | 2.25rem | 600 | Section titles |
| **Heading 3** | `text-2xl` | 1.5rem (24px) | 2rem | 600 | Subsections |
| **Heading 4** | `text-xl` | 1.25rem (20px) | 1.75rem | 600 | Card titles |
| **Heading 5** | `text-lg` | 1.125rem (18px) | 1.75rem | 500 | Small headings |
| **Body Large** | `text-base` | 1rem (16px) | 1.5rem | 400 | Main content |
| **Body** | `text-sm` | 0.875rem (14px) | 1.25rem | 400 | Default text |
| **Caption** | `text-xs` | 0.75rem (12px) | 1rem | 400 | Helper text |

### Font Weights

- **Regular:** `font-normal` (400) - Body text
- **Medium:** `font-medium` (500) - Emphasis
- **Semibold:** `font-semibold` (600) - Headings
- **Bold:** `font-bold` (700) - Strong emphasis

### Line Heights

- **Tight:** `leading-tight` (1.25) - Headings
- **Normal:** `leading-normal` (1.5) - Body text
- **Relaxed:** `leading-relaxed` (1.625) - Long-form content

### Usage Examples

```jsx
// Page Title
<h1 className="text-4xl font-bold">Game Details</h1>

// Section Title
<h2 className="text-2xl font-semibold mb-4">Match Analysis</h2>

// Body Text
<p className="text-sm text-muted-foreground">
  Player performance statistics
</p>

// Caption
<span className="text-xs text-muted-foreground">Last updated 5 minutes ago</span>
```

---

## 📏 SPACING & LAYOUT

### Spacing Scale

Tailwind's default spacing scale (1 unit = 0.25rem = 4px):

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `0` | 0rem | 0px | No spacing |
| `1` | 0.25rem | 4px | Minimal spacing |
| `2` | 0.5rem | 8px | Tight spacing |
| `3` | 0.75rem | 12px | Small spacing |
| `4` | 1rem | 16px | **Default spacing** |
| `5` | 1.25rem | 20px | Medium spacing |
| `6` | 1.5rem | 24px | Large spacing |
| `8` | 2rem | 32px | Extra large spacing |
| `10` | 2.5rem | 40px | Section spacing |
| `12` | 3rem | 48px | Major section spacing |
| `16` | 4rem | 64px | Page section spacing |

### Common Spacing Patterns

```jsx
// Card padding
<div className="p-6">Content</div>

// Section spacing
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Form field spacing
<div className="space-y-2">
  <Label>Field Label</Label>
  <Input />
</div>

// Button gap
<div className="flex gap-2">
  <Button>Save</Button>
  <Button variant="secondary">Cancel</Button>
</div>
```

---

### Border Radius

| Token | Tailwind Class | Size | Usage |
|-------|---------------|------|-------|
| **Small** | `rounded-sm` | calc(0.5rem - 4px) | Tight corners |
| **Medium** | `rounded-md` | calc(0.5rem - 2px) | Input fields |
| **Large** | `rounded-lg` | 0.5rem | Cards, dialogs |
| **XL** | `rounded-xl` | 0.75rem | Large cards |
| **2XL** | `rounded-2xl` | 1rem | Hero sections |
| **Full** | `rounded-full` | 9999px | Circular elements |

**Default:** `--radius: 0.5rem` (8px)

---

### Shadows

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| **Small** | `shadow-sm` | Subtle elevation |
| **Medium** | `shadow` | Cards |
| **Large** | `shadow-lg` | Modals, popovers |
| **XL** | `shadow-xl` | Major elevation |
| **2XL** | `shadow-2xl` | Dramatic elevation |

---

## 🧩 COMPONENTS

### Button

**File:** `frontend/src/shared/ui/primitives/button.jsx`

#### Variants

##### **Default** (Primary)
```jsx
<Button>Save Changes</Button>
<Button variant="default">Save Changes</Button>
```
- **Style:** Dark background, light text
- **Usage:** Primary action on page (one per section)
- **Example:** "Save", "Submit", "Create Game"

##### **Destructive**
```jsx
<Button variant="destructive">Delete Player</Button>
```
- **Style:** Red background, white text
- **Usage:** Destructive actions (delete, remove)
- **Example:** "Delete", "Remove", "Cancel Game"

##### **Outline**
```jsx
<Button variant="outline">View Details</Button>
```
- **Style:** Border only, transparent background
- **Usage:** Secondary actions
- **Example:** "Cancel", "Go Back", "View More"

##### **Secondary**
```jsx
<Button variant="secondary">Filter</Button>
```
- **Style:** Light gray background
- **Usage:** Tertiary actions
- **Example:** "Filter", "Sort", "Settings"

##### **Ghost**
```jsx
<Button variant="ghost">Edit</Button>
```
- **Style:** No background until hover
- **Usage:** Subtle actions, table rows
- **Example:** "Edit", "Info", icon buttons in rows

##### **Link**
```jsx
<Button variant="link">Learn More</Button>
```
- **Style:** Text with underline on hover
- **Usage:** Inline links that look like buttons
- **Example:** "Learn More", "See Documentation"

---

#### Sizes

```jsx
<Button size="sm">Small</Button>      // h-8, px-3, text-xs
<Button size="default">Default</Button> // h-9, px-4, py-2 (Default)
<Button size="lg">Large</Button>      // h-10, px-8
<Button size="icon">🔍</Button>        // h-9, w-9 (square)
```

---

#### States

**Disabled:**
```jsx
<Button disabled>Disabled</Button>
```
- Opacity: 50%
- Cursor: not-allowed
- Pointer events disabled

**Loading:**
```jsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

**With Icon:**
```jsx
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Player
</Button>
```

---

#### Usage Guidelines

✅ **Do:**
- Use one primary button per section
- Use destructive variant for dangerous actions
- Add icons for clarity
- Use appropriate size for context

❌ **Don't:**
- Use multiple primary buttons in same view
- Use destructive for non-destructive actions
- Make buttons too small (minimum touch target: 44x44px)
- Use all caps text (sentence case preferred)

---

### Input

**File:** `frontend/src/shared/ui/primitives/input.jsx`

#### Basic Input

```jsx
<Input type="text" placeholder="Enter player name" />
<Input type="email" placeholder="email@example.com" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="0" />
```

#### States

**Default:**
- Border: `border-input`
- Height: `h-9` (36px)
- Padding: `px-3 py-1`

**Focus:**
- Ring: `ring-1 ring-ring`
- Outline: None

**Disabled:**
```jsx
<Input disabled placeholder="Disabled input" />
```
- Cursor: not-allowed
- Opacity: 50%

**Error:**
```jsx
<Input className="border-destructive" />
```

---

#### With Label

```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="email@example.com" />
</div>
```

#### With Error Message

```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    className="border-destructive"
    aria-invalid="true"
  />
  <p className="text-xs text-destructive">Invalid email address</p>
</div>
```

---

### Badge

**File:** `frontend/src/shared/ui/primitives/badge.jsx`

#### Variants

```jsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

#### Usage Examples

**Game Status:**
```jsx
<Badge variant="default">Scheduled</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge className="bg-brand-green text-white">Done</Badge>
<Badge className="bg-brand-blue text-white">Played</Badge>
```

**Player Position:**
```jsx
<Badge variant="outline">GK</Badge>
<Badge variant="outline">DEF</Badge>
<Badge variant="outline">MID</Badge>
<Badge variant="outline">FWD</Badge>
```

---

### Dialog (Modal)

**File:** `frontend/src/shared/ui/primitives/dialog.jsx`

#### BaseDialog Wrapper

**File:** `frontend/src/shared/ui/composed/BaseDialog.jsx`

```jsx
<BaseDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add New Player"
  description="Enter player details below"
  maxWidth="md"
  loading={isSaving}
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save Player</Button>
    </>
  }
>
  <div className="space-y-4">
    {/* Dialog content */}
  </div>
</BaseDialog>
```

#### Max Width Options

- `sm` - 384px (24rem)
- `md` - 512px (32rem) - **Default**
- `lg` - 768px (48rem)
- `xl` - 1024px (64rem)
- `2xl` - 1280px (80rem)

---

### Card

**File:** `frontend/src/shared/ui/primitives/card.jsx`

```jsx
<Card>
  <CardHeader>
    <CardTitle>Match Statistics</CardTitle>
    <CardDescription>Player performance overview</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

**Usage:** Player cards, game cards, dashboard widgets

---

### Select (Dropdown)

**File:** `frontend/src/shared/ui/primitives/select.jsx`

```jsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select position" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="GK">Goalkeeper</SelectItem>
    <SelectItem value="DEF">Defender</SelectItem>
    <SelectItem value="MID">Midfielder</SelectItem>
    <SelectItem value="FWD">Forward</SelectItem>
  </SelectContent>
</Select>
```

---

### Form Components

#### FormField (Shared)

**File:** `frontend/src/shared/ui/form/FormField.jsx`

```jsx
<FormField
  label="Player Name"
  error={errors.name}
  required
>
  <Input 
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Enter name"
  />
</FormField>
```

#### MinuteInput (Shared)

**File:** `frontend/src/shared/ui/form/MinuteInput.jsx`

```jsx
<MinuteInput
  label="Goal Minute"
  value={minute}
  onChange={setMinute}
  max={120}
  required
/>
```

#### PlayerSelect (Shared)

**File:** `frontend/src/shared/ui/form/PlayerSelect.jsx`

```jsx
<PlayerSelect
  label="Select Player"
  value={playerId}
  onChange={setPlayerId}
  players={availablePlayers}
  required
/>
```

---

## ♿ ACCESSIBILITY

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 Level AA standards.

#### Color Contrast

**Minimum Requirements:**
- **Normal text:** 4.5:1 contrast ratio
- **Large text (18pt+):** 3:1 contrast ratio
- **UI elements:** 3:1 contrast ratio

**Testing:**
- Test all color combinations
- Use browser dev tools for contrast checking
- Test in both light and dark modes

---

### Keyboard Navigation

All interactive elements must be keyboard accessible:

#### Focus Management

**Focus Indicator:**
```jsx
// Visible focus ring on all interactive elements
className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

**Tab Order:**
- Natural DOM order
- Skip links for complex pages
- Focus trap for modals

**Keyboard Shortcuts:**
- `Tab` - Navigate forward
- `Shift + Tab` - Navigate backward
- `Enter/Space` - Activate buttons
- `Escape` - Close dialogs/modals
- `Arrow keys` - Navigate lists/menus

---

### Screen Readers

**ARIA Labels:**
```jsx
// Icon buttons
<Button size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Form inputs
<Input 
  id="email" 
  aria-describedby="email-error"
  aria-invalid={hasError}
/>

// Error messages
<span id="email-error" role="alert">
  {error}
</span>
```

**ARIA States:**
- `aria-expanded` - For dropdowns/accordions
- `aria-selected` - For selected items
- `aria-disabled` - For disabled elements
- `aria-busy` - For loading states

---

### Focus Trap (Modals)

Dialogs automatically trap focus:
- Focus moves to dialog on open
- Tab cycles within dialog
- Escape closes dialog
- Focus returns to trigger on close

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

| Breakpoint | Tailwind Class | Min Width | Usage |
|-----------|---------------|-----------|-------|
| **Mobile** | (default) | 0px | Mobile devices |
| **SM** | `sm:` | 640px | Large phones |
| **MD** | `md:` | 768px | Tablets |
| **LG** | `lg:` | 1024px | Laptops |
| **XL** | `xl:` | 1280px | Desktops |
| **2XL** | `2xl:` | 1536px | Large screens |

### Mobile-First Approach

Design for mobile, enhance for larger screens:

```jsx
// Mobile: Stack vertically, Desktop: Side by side
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left content</div>
  <div className="w-full md:w-1/2">Right content</div>
</div>

// Mobile: Small text, Desktop: Larger text
<h1 className="text-2xl md:text-4xl font-bold">Title</h1>

// Mobile: Hidden, Desktop: Visible
<div className="hidden md:block">Desktop only content</div>
```

---

## 🎭 DARK MODE

### Implementation

Dark mode is implemented using CSS variables and the `class` strategy:

```html
<!-- Light mode (default) -->
<html>

<!-- Dark mode -->
<html class="dark">
```

### Theme Toggle

```jsx
import { useTheme } from '@/app/providers/ThemeProvider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
```

### Dark Mode Colors

Colors automatically adapt based on theme:

```jsx
// Automatically adapts to theme
<div className="bg-background text-foreground">
  Content
</div>

// Card adapts to theme
<Card className="bg-card text-card-foreground">
  Card content
</Card>
```

---

## 📚 USAGE GUIDELINES

### Component Selection

#### When to use Button variants:

| Variant | Use Case | Example |
|---------|----------|---------|
| **Default** | Primary action | "Save Changes", "Create Game" |
| **Destructive** | Dangerous action | "Delete Player", "Cancel Game" |
| **Outline** | Secondary action | "Cancel", "Go Back" |
| **Secondary** | Tertiary action | "Filter", "Sort" |
| **Ghost** | Subtle action | Edit icons in tables |
| **Link** | Inline link | "Learn More", "See Docs" |

#### When to use Badge:

- **Status indicators** - Game status, player status
- **Categories** - Player positions, game types
- **Counts** - Notification counts, item counts
- **Labels** - Tags, filters

#### When to use Card:

- **Data grouping** - Player stats, game summary
- **Dashboard widgets** - Recent games, quick stats
- **List items** - Player cards, game cards
- **Forms** - Multi-section forms

---

### Common Patterns

#### Form Layout

```jsx
<form className="space-y-6">
  <div className="space-y-4">
    <FormField label="Player Name" required>
      <Input placeholder="Enter name" />
    </FormField>
    
    <FormField label="Position" required>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GK">Goalkeeper</SelectItem>
          {/* ... */}
        </SelectContent>
      </Select>
    </FormField>
  </div>
  
  <div className="flex justify-end gap-2">
    <Button variant="outline" type="button">Cancel</Button>
    <Button type="submit">Save Player</Button>
  </div>
</form>
```

#### List with Actions

```jsx
<div className="space-y-2">
  {items.map(item => (
    <Card key={item.id} className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  ))}
</div>
```

#### Modal with Form

```jsx
<BaseDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add Goal"
  maxWidth="md"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={!isValid}>
        Save Goal
      </Button>
    </>
  }
>
  <div className="space-y-4">
    <MinuteInput 
      label="Goal Minute"
      value={minute}
      onChange={setMinute}
      required
    />
    
    <PlayerSelect
      label="Scorer"
      value={scorerId}
      onChange={setScorerId}
      players={players}
      required
    />
  </div>
</BaseDialog>
```

---

## 🎨 Design Tokens Reference

### Quick Reference Table

| Category | Tokens | File |
|----------|--------|------|
| **Colors** | 60+ semantic + 6 brand palettes | `tailwind.config.js` |
| **Spacing** | 0-96 (0px-384px) | Tailwind default |
| **Typography** | 9 sizes, 4 weights | Tailwind extended |
| **Border Radius** | sm, md, lg, xl, 2xl, full | `tailwind.config.js` |
| **Shadows** | sm, default, lg, xl, 2xl | Tailwind default |
| **Breakpoints** | sm, md, lg, xl, 2xl | Tailwind default |

---

## 📦 Component Library

### Available Components (60+)

**Primitives** (`shared/ui/primitives/`):
- Accordion, Alert, AlertDialog, Avatar
- Badge, Breadcrumb, Button, Calendar
- Card, Carousel, Checkbox, Collapsible
- Command, ContextMenu, DatePicker, Dialog
- Drawer, Dropdown, Form, HoverCard
- Input, Label, MenuBar, NavigationMenu
- Pagination, Popover, Progress, RadioGroup
- ScrollArea, Select, Separator, Sheet
- Sidebar, Skeleton, Slider, Sonner
- Switch, Table, Tabs, Textarea
- Toast, Toggle, ToggleGroup, Tooltip
- And more...

**Composed** (`shared/ui/composed/`):
- BaseDialog, StatSliderControl

**Form** (`shared/ui/form/`):
- FormField, MinuteInput, PlayerSelect

---

## 🔗 Related Documentation

- **Architecture:** `docs/official/frontendSummary.md`
- **Component Code:** `frontend/src/shared/ui/`
- **Tailwind Config:** `frontend/tailwind.config.js`
- **Theme CSS:** `frontend/src/index.css`

---

## 📝 Contributing

When adding new components or patterns:

1. ✅ Follow existing component structure
2. ✅ Use semantic color tokens
3. ✅ Ensure keyboard accessibility
4. ✅ Test in light and dark modes
5. ✅ Add JSDoc comments
6. ✅ Update this documentation

---

**Last Updated:** January 2026  
**Version:** 1.0  
**Maintainer:** Squad Up Development Team

