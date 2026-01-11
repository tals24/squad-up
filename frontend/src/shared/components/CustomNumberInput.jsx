import React from 'react';
import { Input } from '@/shared/ui/primitives/input';
import { Button } from '@/shared/ui/primitives/button';
import { Plus, Minus } from 'lucide-react';

const CustomNumberInput = ({
  value,
  onChange,
  min = 0,
  max = 999,
  placeholder,
  className,
  disabled = false,
}) => {
  const handleValueChange = (newValue) => {
    // Create a synthetic event object that mimics a real input event
    const syntheticEvent = {
      target: {
        value: String(newValue),
      },
    };
    onChange(syntheticEvent);
  };

  const handleIncrement = () => {
    const numericValue = parseInt(value, 10) || 0;
    if (numericValue < max) {
      handleValueChange(numericValue + 1);
    }
  };

  const handleDecrement = () => {
    const numericValue = parseInt(value, 10) || 0;
    if (numericValue > min) {
      handleValueChange(numericValue - 1);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-0 h-full w-8 rounded-r-none text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
        className="text-center bg-bg-secondary border-border-custom text-text-primary text-lg font-bold focus:border-accent-primary focus:ring-accent-primary/20 transition-all duration-300 pl-8 pr-8"
        style={{ appearance: 'textfield' }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 h-full w-8 rounded-l-none text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default CustomNumberInput;
