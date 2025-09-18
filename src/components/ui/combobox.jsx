"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({ 
  options, 
  value, 
  onValueChange,
  onInputChange,
  inputValue,
  placeholder, 
  searchPlaceholder, 
  emptyPlaceholder,
  loading = false
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-bg-secondary border-border-custom text-text-primary hover:bg-bg-secondary focus:border-accent-primary focus:ring-accent-primary/20"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder || "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-bg-secondary border-border-custom text-text-primary">
        <Command className="bg-bg-secondary">
          <CommandInput 
            placeholder={searchPlaceholder || "Search..."} 
            value={inputValue}
            onValueChange={onInputChange}
            className="text-text-primary bg-bg-secondary border-border-custom placeholder-text-secondary"
          />
          <CommandList className="bg-bg-secondary">
            {loading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
              </div>
            )}
            {!loading && (
              <CommandEmpty className="text-text-secondary">{emptyPlaceholder || "No option found."}</CommandEmpty>
            )}
            <CommandGroup className="bg-bg-secondary">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentValue) => {
                    const selectedValue = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase())?.value;
                    onValueChange(selectedValue === value ? "" : selectedValue)
                    setOpen(false)
                  }}
                  className="aria-selected:bg-bg-secondary hover:bg-bg-secondary text-text-primary focus:bg-bg-secondary"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}