import React, { useState } from 'react';
import { MoreVertical, Eye, X } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/primitives/dropdown-menu';

const DrillMenuDropdown = ({
  drill,
  onViewDetails,
  onRemove,
  className = '',
  showRemove = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleViewDetails = () => {
    onViewDetails(drill);
    setIsOpen(false);
  };

  const handleRemove = () => {
    onRemove(drill);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 ${className}`}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-slate-800 border-slate-600 shadow-xl"
        side="left"
      >
        <DropdownMenuItem
          onClick={handleViewDetails}
          className="text-slate-200 hover:bg-slate-700 hover:text-cyan-400 cursor-pointer"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {showRemove && (
          <DropdownMenuItem
            onClick={handleRemove}
            className="text-slate-200 hover:bg-slate-700 hover:text-red-400 cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Remove Drill
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DrillMenuDropdown;
