import React from "react";
import { Plus } from "lucide-react";
import { PageHeader, SearchFilter, StandardButton } from "@/shared/ui/primitives/design-system-components";

export default function DrillLibraryHeader({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  ageGroupFilter,
  onAgeGroupChange,
  categories,
  ageGroups,
  onOpenAddModal
}) {
  return (
    <>
      <PageHeader
        title="Drill"
        accentWord="Library"
        subtitle="Browse and manage training drills"
        actionButton={
          <StandardButton 
            onClick={onOpenAddModal}
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
          >
            Add Drill
          </StandardButton>
        }
      />

      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        placeholder="Search drills by name..."
        filters={[
          {
            value: categoryFilter,
            onChange: onCategoryChange,
            placeholder: "All Categories",
            options: [
              { value: "all", label: "All Categories" },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]
          },
          {
            value: ageGroupFilter,
            onChange: onAgeGroupChange,
            placeholder: "All Age Groups",
            options: [
              { value: "all", label: "All Age Groups" },
              ...ageGroups.map(age => ({ value: age, label: age }))
            ]
          }
        ]}
      />
    </>
  );
}
