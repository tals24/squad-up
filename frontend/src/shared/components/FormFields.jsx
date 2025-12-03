import React from "react";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/primitives/select";

/**
 * Text Input Field Component
 */
export function TextInputField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  type = "text",
  icon: Icon,
  iconColor = "text-brand-blue",
  width, // Custom width prop
  formData, // Added to support conditional requirements
  handleChange // Alternative prop name from GenericAddPage
}) {
  // Handle conditional requirements
  const isRequired = typeof required === 'function' ? required(formData) : required;
  
  // Use the correct value and onChange function
  const fieldValue = value || (formData && formData[id]) || '';
  const fieldOnChange = onChange || handleChange;
  
  // Special handling for date inputs to prevent calendar picker issues
  if (type === "date") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          {label} {isRequired && "*"}
        </Label>
        <div className="relative">
          <Input
            id={id}
            type="date"
            value={fieldValue}
            onChange={(e) => fieldOnChange(id, e.target.value)}
            placeholder={placeholder}
            className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors ${width || ''}`}
            required={isRequired}
            style={{ paddingLeft: '20px', paddingRight: '12px' }}
          />
          <button
            type="button"
            className="absolute left-1 top-1/2 transform -translate-y-1/2 p-0 hover:bg-accent/20 rounded transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const input = document.getElementById(id);
              if (input && input.showPicker) {
                input.showPicker();
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Icon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        {label} {isRequired && "*"}
      </Label>
      <Input
        id={id}
        type={type}
        value={fieldValue}
        onChange={(e) => fieldOnChange(id, e.target.value)}
        placeholder={placeholder}
        className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors ${width || ''}`}
        required={isRequired}
      />
    </div>
  );
}

/**
 * Select Field Component
 */
export function SelectField({ 
  id, 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder, 
  required = false,
  icon: Icon,
  iconColor = "text-brand-blue",
  formData, // Added to support conditional requirements
  handleChange // Alternative prop name from GenericAddPage
}) {
  // Handle conditional requirements
  const isRequired = typeof required === 'function' ? required(formData) : required;
  
  // Use the correct value and onChange function
  const fieldValue = value || (formData && formData[id]);
  const fieldOnChange = onChange || handleChange;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        {label} {isRequired && "*"}
      </Label>
      <Select value={fieldValue} onValueChange={(newValue) => {
        if (typeof fieldOnChange === 'function') {
          fieldOnChange(id, newValue);
        } else {
          console.error(`fieldOnChange is not a function for ${id}:`, { onChange, handleChange, fieldOnChange });
        }
      }}>
        <SelectTrigger className="bg-background border-border text-foreground focus:border-brand-blue focus:ring-brand-blue/20 hover:bg-accent/50 transition-colors">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border-border text-foreground">
          {options.map(option => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className="text-foreground focus:bg-accent hover:bg-accent"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Textarea Field Component
 */
export function TextareaField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  icon: Icon,
  iconColor = "text-brand-blue",
  formData, // Added to support conditional requirements
  handleChange // Alternative prop name from GenericAddPage
}) {
  // Handle conditional requirements
  const isRequired = typeof required === 'function' ? required(formData) : required;
  
  // Use the correct value and onChange function
  const fieldValue = value || (formData && formData[id]) || '';
  const fieldOnChange = onChange || handleChange;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        {label} {isRequired && "*"}
      </Label>
      <Textarea
        id={id}
        value={fieldValue}
        onChange={(e) => fieldOnChange(id, e.target.value)}
        placeholder={placeholder}
        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors"
        required={isRequired}
      />
    </div>
  );
}

/**
 * Form Grid Container
 */
export function FormGrid({ children, columns = 2, formData, handleChange, onChange, ...restProps }) {
  const gridClass = columns === 1 ? "grid gap-6" : `grid md:grid-cols-${columns} gap-6`;
  
  // Filter out DOM-related props that shouldn't be passed to children
  const { className, style, id, ...cleanProps } = restProps;
  
  return (
    <div className={gridClass}>
      {React.Children.map(children, child => {
        // Only clone React elements, skip null/undefined children
        if (!React.isValidElement(child)) {
          return child;
        }
        
        // Only pass props to our FormField components, not to regular div/DOM elements
        const isFormFieldComponent = child.type && (
          child.type === TextInputField || 
          child.type === SelectField ||
          child.type === TextareaField ||
          (typeof child.type === 'function' && child.type.name && 
           (child.type.name.includes('Field') || child.type.name.includes('Input')))
        );
        
        if (isFormFieldComponent) {
          return React.cloneElement(child, { 
            formData, 
            handleChange,
            onChange,
            ...cleanProps
          });
        }
        
        // For non-FormField components, just return them as-is
        return child;
      })}
    </div>
  );
}
