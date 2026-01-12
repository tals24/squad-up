import React, { useState, useMemo } from 'react';
import { useData } from '@/app/providers/DataProvider';
import { Input } from '@/shared/ui/primitives/input';
import { Search, ClipboardList } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { Badge } from '@/shared/ui/primitives/badge';
import { getCategoryColor, getAgeColor } from '@/shared/utils';
import DrillMenuDropdown from '@/features/drill-system/components/DrillMenuDropdown';
import DrillDetailModal from '@/features/drill-system/components/DrillDetailModal';

export default function DrillLibrarySidebar({ context = 'library' }) {
  const { drills, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(drills.map((d) => d.category).filter(Boolean))],
    [drills]
  );

  const ageGroups = useMemo(() => {
    const allAgeGroups = drills
      .flatMap((drill) => {
        return Array.isArray(drill.targetAgeGroup) ? drill.targetAgeGroup : [drill.targetAgeGroup];
      })
      .filter(Boolean);

    // Get unique age groups and sort them in the correct order
    const uniqueAgeGroups = [...new Set(allAgeGroups)];
    const orderedAgeGroups = ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];

    return orderedAgeGroups.filter((age) => uniqueAgeGroups.includes(age));
  }, [drills]);

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const nameMatch = drill.drillName?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || drill.category === categoryFilter;
      const ageMatch =
        ageFilter === 'all' ||
        (Array.isArray(drill.targetAgeGroup) 
          ? drill.targetAgeGroup.includes(ageFilter) 
          : drill.targetAgeGroup === ageFilter);
      return nameMatch && categoryMatch && ageMatch;
    });
  }, [drills, searchTerm, categoryFilter, ageFilter]);

  const handleDragStart = (e, drill) => {
    const drillData = JSON.stringify({
      _id: drill._id,
      drillName: drill.drillName,
    });
    e.dataTransfer.setData('application/json', drillData);
  };

  const handleViewDetails = (drill) => {
    if (context === 'training-planner') {
      // In training planner context, show modal
      setSelectedDrill(drill);
      setIsDetailModalOpen(true);
    } else {
      // In drill library context, navigate to drill library page
      window.location.href = `/DrillLibrary?drillId=${drill._id}`;
    }
  };

  const handleRemoveDrill = (drill) => {
    // This function is not applicable in the sidebar context
    // Drills can only be removed from the calendar, not from the library
    console.log('Remove drill not applicable in sidebar context');
  };

  if (isLoading) {
    return (
      <aside className="w-80 bg-slate-800/50 border-l border-slate-700 p-4">
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-400">Loading drills...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-cyan-400" />
          Drill Library
        </h2>
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search drills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-white">
              <SelectItem value="all" className="focus:bg-slate-700">
                All Categories
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="focus:bg-slate-700">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
              <SelectValue placeholder="All Ages" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-white">
              <SelectItem value="all" className="focus:bg-slate-700">
                All Ages
              </SelectItem>
              {ageGroups.map((age) => (
                <SelectItem key={age} value={age} className="focus:bg-slate-700">
                  {age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredDrills.map((drill) => (
          <div
            key={drill._id}
            draggable
            onDragStart={(e) => handleDragStart(e, drill)}
            className="p-3 bg-slate-700/30 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-700/50 border border-slate-600/50 hover:border-cyan-400/50 transition-colors duration-200 group relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">
                  {drill.drillName}
                </p>
                <div className="flex gap-2 mt-2">
                  {drill.category && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(drill.category)}`}
                    >
                      {drill.category}
                    </Badge>
                  )}
                  {drill.targetAgeGroup && (
                    <Badge variant="outline" className={`text-xs ${getAgeColor()}`}>
                      {drill.targetAgeGroup}
                    </Badge>
                  )}
                </div>
              </div>
              <div
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <DrillMenuDropdown
                  drill={drill}
                  onViewDetails={handleViewDetails}
                  onRemove={handleRemoveDrill}
                  showRemove={false}
                  className="hover:bg-slate-600/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drill Detail Modal - only show in training planner context */}
      {context === 'training-planner' && (
        <DrillDetailModal
          drill={selectedDrill}
          open={isDetailModalOpen}
          setOpen={setIsDetailModalOpen}
          source="training-planner"
        />
      )}
    </aside>
  );
}
