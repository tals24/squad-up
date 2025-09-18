import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  formData // Added to support conditional requirements
}) {
  // Handle conditional requirements
  const isRequired = typeof required === 'function' ? required(formData) : required;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        {label} {isRequired && "*"}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
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
  formData // Added to support conditional requirements
}) {
  // Handle conditional requirements
  const isRequired = typeof required === 'function' ? required(formData) : required;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        {label} {isRequired && "*"}
      </Label>
      <Select value={value} onValueChange={(newValue) => onChange(id, newValue)}>
        <SelectTrigger className="bg-background border-border text-foreground focus:border-brand-blue focus:ring-brand-blue/20">
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
 * Form Grid Container
 */
export function FormGrid({ children, columns = 2 }) {
  const gridClass = columns === 1 ? "grid gap-6" : `grid md:grid-cols-${columns} gap-6`;
  
  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}
