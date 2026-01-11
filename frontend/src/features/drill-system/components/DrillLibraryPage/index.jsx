import React, { useState, useMemo } from 'react';
import { useData } from '@/app/providers/DataProvider';
import { PageLayout } from '@/shared/ui/primitives/design-system-components';
import ConfirmationToast from '@/shared/components/ConfirmationToast';
import DrillLibraryHeader from './components/DrillLibraryHeader';
import DrillGrid from './components/DrillGrid';
import AddDrillDialog from './components/dialogs/AddDrillDialog';
import DrillDetailDialog from './components/dialogs/DrillDetailDialog';

export default function DrillLibrary() {
  const { drills, users, isLoading: isDataLoading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const exactCategories = ['Dribbling', 'Shooting', 'Passing', 'Defense', 'Goalkeeping', 'Warm-up'];
  const exactAgeGroups = ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const drillName = (drill.drillName || drill.DrillName || '').toLowerCase();
      const nameMatch = drillName.includes(searchTerm.toLowerCase());

      const category = drill.category || drill.Category;
      const categoryMatch = categoryFilter === 'all' || category === categoryFilter;

      const ageGroups = drill.targetAgeGroup || drill.TargetAgeGroup;
      const ageGroupMatch =
        ageGroupFilter === 'all' ||
        (() => {
          if (Array.isArray(ageGroups)) {
            return ageGroups.includes(ageGroupFilter);
          }
          return ageGroups === ageGroupFilter;
        })();

      return nameMatch && categoryMatch && ageGroupMatch;
    });
  }, [drills, searchTerm, categoryFilter, ageGroupFilter]);

  const handleDrillClick = (drill) => {
    console.log('[DrillLibrary] Opening drill detail:', drill);
    console.log('[DrillLibrary] Drill layoutData:', drill?.layoutData);
    console.log('[DrillLibrary] Drill DrillLayoutData:', drill?.DrillLayoutData);
    setSelectedDrill(drill);
    setIsDetailModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const showConfirmationMessage = (config) => {
    console.log('Showing confirmation:', config);
    setConfirmationConfig(config);
    setShowConfirmation(true);
  };

  if (isDataLoading) {
    return (
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
            <div className="h-16 bg-bg-secondary rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-bg-secondary rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout>
        <DrillLibraryHeader
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          ageGroupFilter={ageGroupFilter}
          onAgeGroupChange={setAgeGroupFilter}
          categories={exactCategories}
          ageGroups={exactAgeGroups}
          onOpenAddModal={handleOpenAddModal}
        />

        {/* Drills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DrillGrid drills={filteredDrills} onDrillClick={handleDrillClick} />
        </div>
      </PageLayout>

      <AddDrillDialog
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        refreshData={refreshData}
        showConfirmation={showConfirmationMessage}
        categories={exactCategories}
        ageGroups={exactAgeGroups}
      />

      <DrillDetailDialog
        drill={selectedDrill}
        open={isDetailModalOpen}
        setOpen={setIsDetailModalOpen}
      />

      <ConfirmationToast
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        type={confirmationConfig.type}
      />
    </>
  );
}
