# Generic Add Page Template

A reusable template for creating consistent "Add" pages across the SquadUp application.

## 🎯 Purpose

The `GenericAddPage` component provides:
- **Consistent UI/UX** across all "Add" pages
- **Standardized form handling** and validation
- **Professional styling** with ambient effects and gradients
- **Error handling** and success notifications
- **Accessibility** features built-in

## 🚀 Quick Start

### 1. Basic Usage

```jsx
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddYourEntity() {
  const initialFormData = {
    field1: "",
    field2: ""
  };

  const handleSubmit = async (formData) => {
    // Your submission logic here
    return { success: true, message: "Entity created!" };
  };

  const isFormValid = (formData) => {
    return formData.field1?.trim() && formData.field2?.trim();
  };

  return (
    <GenericAddPage
      entityName="YourEntity"
      entityDisplayName="Your Entity"
      description="Create a new entity"
      icon={YourIcon}
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
    >
      <FormGrid>
        <TextInputField
          id="field1"
          label="Field 1"
          placeholder="Enter value"
          required={true}
        />
        <SelectField
          id="field2"
          label="Field 2"
          options={[{value: "opt1", label: "Option 1"}]}
        />
      </FormGrid>
    </GenericAddPage>
  );
}
```

## 📝 Props Reference

### GenericAddPage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityName` | string | **required** | Name of the entity (e.g., "User", "Player") |
| `entityDisplayName` | string | `entityName` | Display name for UI |
| `description` | string | | Subtitle description |
| `icon` | Component | | Icon for the card header |
| `titleIcon` | Component | | Icon for the page title |
| `titleColor` | string | `"text-brand-blue"` | Color for title highlight |
| `backUrl` | string | `"Dashboard"` | URL to navigate back to |
| `initialFormData` | object | `{}` | Initial form state |
| `onSubmit` | function | **required** | `(formData) => Promise<{success, message?, error?}>` |
| `isFormValid` | function | `() => true` | `(formData) => boolean` |
| `isLoading` | boolean | `false` | Loading state |
| `children` | ReactNode | | Form fields |

### Form Field Components

#### TextInputField
```jsx
<TextInputField
  id="fieldName"           // Form field key
  label="Display Label"    // Label text
  placeholder="Enter..."   // Placeholder text
  required={true}          // Show * and validate
  type="text"              // Input type (text, email, number, date, etc.)
  icon={IconComponent}     // Icon component
  iconColor="text-brand-blue" // Icon color class
/>
```

#### SelectField
```jsx
<SelectField
  id="fieldName"
  label="Display Label"
  placeholder="Select..."
  required={true}
  options={[
    { value: "val1", label: "Label 1" },
    { value: "val2", label: "Label 2" }
  ]}
  icon={IconComponent}
  iconColor="text-brand-blue"
/>
```

#### FormGrid
```jsx
<FormGrid columns={2}>  {/* 1 or 2 columns */}
  {/* Form fields */}
</FormGrid>
```

## 🎨 Styling Features

### Automatic Styling
- **Dark background** (`bg-slate-900`) matching Dashboard
- **Ambient effects** with gradients and glows
- **Professional card** with backdrop blur
- **Brand color integration** throughout
- **Responsive design** for mobile and desktop

### Semantic Colors
All components use semantic design tokens:
- `text-foreground` / `text-muted-foreground`
- `bg-background` / `bg-card`
- `border-border`
- `text-brand-blue` / `bg-brand-blue`
- `focus:border-ring focus:ring-ring/20`

## 🔧 Advanced Usage

### Custom Validation
```jsx
const isFormValid = (formData) => {
  if (!formData.email?.includes('@')) return false;
  if (formData.age < 18) return false;
  return true;
};
```

### Custom Submit Handler
```jsx
const handleSubmit = async (formData) => {
  try {
    // Your API call
    const response = await yourAPI.create(formData);
    
    return {
      success: true,
      message: `${formData.name} was created successfully!`
    };
  } catch (error) {
    throw new Error(error.message);
  }
};
```

### Complex Form Layout
```jsx
<FormGrid columns={2}>
  <TextInputField id="name" label="Name" required />
  <TextInputField id="email" label="Email" type="email" required />
  
  <FormGrid columns={1}>
    <SelectField id="department" label="Department" options={deptOptions} />
  </FormGrid>
  
  <TextInputField id="phone" label="Phone" />
  <TextInputField id="position" label="Position" />
</FormGrid>
```

## 📋 Examples

See `AddUser.jsx` for a complete real-world implementation.
See `AddPlayer.example.jsx` for another example.

## 🎯 Benefits

1. **Consistency**: All "Add" pages look and behave identically
2. **Speed**: Create new pages in minutes, not hours
3. **Maintainability**: Single source of truth for styling and behavior
4. **Accessibility**: Built-in ARIA labels and keyboard navigation
5. **Responsive**: Works perfectly on all screen sizes
6. **Professional**: Enterprise-grade design out of the box
