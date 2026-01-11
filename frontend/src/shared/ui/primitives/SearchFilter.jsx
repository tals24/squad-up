import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/primitives/card';
import { Input } from '@/shared/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';

/**
 * SearchFilter Component
 * Provides consistent search and filter functionality across pages
 */
const SearchFilter = ({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  filters = [],
  className = '',
  children, // For additional custom filter elements
}) => {
  return (
    <Card
      className={`shadow-2xl border border-slate-700 bg-slate-800/70 backdrop-blur-sm ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={onSearchChange}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20"
            />
          </div>

          {/* Filter Selects */}
          {filters.map((filter, index) => (
            <Select key={index} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="w-full md:w-48 bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {filter.options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white focus:bg-slate-700 hover:bg-slate-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Custom children for additional filters */}
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilter;
