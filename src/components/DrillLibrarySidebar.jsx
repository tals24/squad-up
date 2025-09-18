import React, { useState, useMemo } from 'react';
import { useData } from './DataContext';
import { Input } from '@/components/ui/input';
import { Search, ClipboardList } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function DrillLibrarySidebar() {
  const { drills, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => 
    [...new Set(drills.map(d => d.Category).filter(Boolean))]
  , [drills]);

  const filteredDrills = useMemo(() => {
    return drills.filter(drill => {
      const nameMatch = drill.DrillName?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || drill.Category === categoryFilter;
      return nameMatch && categoryMatch;
    });
  }, [drills, searchTerm, categoryFilter]);

  const handleDragStart = (e, drill) => {
    const drillData = JSON.stringify({
      id: drill.id,
      DrillName: drill.DrillName,
    });
    e.dataTransfer.setData("application/json", drillData);
  };

  if (isLoading) {
    return (
        <aside className="w-80 bg-bg-secondary border-l border-border-custom p-4">
            <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Loading drills...</p>
            </div>
        </aside>
    )
  }

  return (
    <aside className="w-80 bg-bg-secondary border-l border-border-custom flex flex-col">
      <div className="p-4 border-b border-border-custom">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent-primary" />
            Drill Library
        </h2>
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"/>
            <Input 
              placeholder="Search drills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-bg-secondary border-border-custom focus:border-accent-primary"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-bg-secondary border-border-custom focus:border-accent-primary">
                <SelectValue placeholder="All Categories"/>
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
              <SelectItem value="all" className="focus:bg-bg-secondary">All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat} className="focus:bg-bg-secondary">{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hover">
        {filteredDrills.map(drill => (
          <div
            key={drill.id}
            draggable
            onDragStart={(e) => handleDragStart(e, drill)}
            className="p-3 bg-bg-secondary/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-bg-secondary border border-border-custom/80 hover:border-accent-primary/50 transition-colors duration-200"
          >
            <p className="font-semibold text-sm text-text-primary">{drill.DrillName}</p>
            {drill.Category && <Badge variant="secondary" className="mt-1 text-xs bg-bg-secondary text-text-primary">{drill.Category}</Badge>}
          </div>
        ))}
      </div>
    </aside>
  );
}