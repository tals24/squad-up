import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DrillLabHeader, DrillLabToolbar, DrillLabCanvas } from '@/components/drilllab';
import DrillDescriptionModal from '../components/DrillDescriptionModal';
import ConfirmationToast from '../components/ConfirmationToast';
import { useDrillLabData, useDrillLabHistory, useDrillLabMode } from '@/hooks';
import { postMessageToParent, navigateToLibrary, formatElementsForSave } from '@/utils/drillLabUtils';

export default function DrillLab() {
  const navigate = useNavigate();
  const mode = useDrillLabMode();
  const canvasRef = useRef(null);
  
  // Detect where the user came from for dynamic back button
  const [backButtonConfig, setBackButtonConfig] = useState({
    text: "Back to Library",
    action: () => navigateToLibrary(navigate, createPageUrl)
  });

  // Detect referrer and set appropriate back button
  useEffect(() => {
    const referrer = document.referrer;
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🔍 DrillLab Debug Info:');
    console.log('  - referrer:', referrer);
    console.log('  - currentUrl:', currentUrl);
    console.log('  - urlParams:', Object.fromEntries(urlParams.entries()));
    console.log('  - from param:', urlParams.get('from'));
    
    // Check if we came from training planner (check URL params or referrer)
    const isFromTrainingPlanner = referrer.includes('/TrainingPlanner') || 
                                 referrer.includes('/training-planner') ||
                                 currentUrl.includes('from=training-planner') ||
                                 urlParams.get('from') === 'training-planner';
    
    const isFromDrillLibrary = referrer.includes('/DrillLibrary') || 
                              referrer.includes('/drill-library') ||
                              currentUrl.includes('from=drill-library') ||
                              urlParams.get('from') === 'drill-library';
    
    console.log('🔍 Detection Results:');
    console.log('  - isFromTrainingPlanner:', isFromTrainingPlanner);
    console.log('  - isFromDrillLibrary:', isFromDrillLibrary);
    console.log('  - referrer includes /TrainingPlanner:', referrer.includes('/TrainingPlanner'));
    console.log('  - referrer includes /training-planner:', referrer.includes('/training-planner'));
    console.log('  - referrer includes /DrillLibrary:', referrer.includes('/DrillLibrary'));
    console.log('  - referrer includes /drill-library:', referrer.includes('/drill-library'));
    
    // Force detection based on URL parameter if referrer is not reliable
    if (urlParams.get('from') === 'training-planner') {
      console.log('✅ Force setting back button to Training Planner (from URL param)');
      setBackButtonConfig({
        text: "Back to Training Planner",
        action: () => navigate('/TrainingPlanner')
      });
    } else if (urlParams.get('from') === 'drill-library') {
      console.log('✅ Force setting back button to Drill Library (from URL param)');
      setBackButtonConfig({
        text: "Back to Drill Library",
        action: () => navigate('/DrillLibrary')
      });
    } else if (isFromTrainingPlanner) {
      console.log('✅ Setting back button to Training Planner (from referrer)');
      setBackButtonConfig({
        text: "Back to Training Planner",
        action: () => navigate('/TrainingPlanner')
      });
    } else if (isFromDrillLibrary) {
      console.log('✅ Setting back button to Drill Library (from referrer)');
      setBackButtonConfig({
        text: "Back to Drill Library",
        action: () => navigate('/DrillLibrary')
      });
    } else {
      console.log('⚠️ Defaulting to Library (no source detected)');
      // Default to library
      setBackButtonConfig({
        text: "Back to Library",
        action: () => navigateToLibrary(navigate, createPageUrl)
      });
    }
  }, [navigate]);
  
  // Data management
  const { drillData, setDrillData, isLoading, isSaving, error, saveDrill } = useDrillLabData(
    mode.drillId, 
    mode.mode, 
    mode.searchParams
  );
  
  // History management
  const {
    currentElements,
    saveToHistory,
    undo,
    redo,
    clear,
    canUndo,
    canRedo
  } = useDrillLabHistory(drillData.layoutData || []);

  // UI state
  const [activeTool, setActiveTool] = useState('select');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  // Debug logging for data flow
  useEffect(() => {
    console.log('[DrillLab] Data flow debug:', {
      drillDataLayoutData: drillData.layoutData?.length || 0,
      currentElements: currentElements?.length || 0,
      isLoading,
      mode: mode.mode,
      isReadOnly: mode.isReadOnly
    });
  }, [drillData.layoutData, currentElements, isLoading, mode.mode, mode.isReadOnly]);

  // Update drill data when elements change (only for non-read-only mode)
  useEffect(() => {
    if (!mode.isReadOnly) {
      setDrillData(prev => ({
        ...prev,
        layoutData: currentElements
      }));
    }
  }, [currentElements, setDrillData, mode.isReadOnly]);

  // Handle save operation
  const handleSave = async () => {
    if (mode.isReadOnly) {
      console.warn('[DrillLab] Save aborted. Read-only mode');
      return;
    }

    const elementsToSave = formatElementsForSave(currentElements);
    console.log('[DrillLab] Saving elements:', elementsToSave.length);

    if (mode.isCreate) {
      // For create mode, post message to parent
      postMessageToParent('DRILL_LAB_SAVE', { elements: elementsToSave });
      
      setConfirmationConfig({
        type: 'success',
        title: 'Draft Saved! 🎨',
        message: 'Your drill design has been saved to the draft.'
      });
      setShowConfirmation(true);
      
      // Close window after a short delay
      setTimeout(() => {
        if (window.opener) {
          window.close();
        }
      }, 1500);
    } else {
      // For edit mode, save to database
      const result = await saveDrill(elementsToSave);
      
      if (result.success) {
        setConfirmationConfig({
          type: 'success',
          title: 'Tactic Board Saved! 🚀',
          message: 'Your drill diagram has been successfully saved.'
        });
        setShowConfirmation(true);
      } else {
        setConfirmationConfig({
          type: 'error',
          title: 'Save Failed',
          message: result.error || 'Could not save the diagram. Please try again.'
        });
        setShowConfirmation(true);
      }
    }
  };

  // Handle clear operation
  const handleClear = () => {
    if (mode.isReadOnly) return;
    clear();
  };

  // Handle back navigation
  const handleBack = () => {
    navigateToLibrary(navigate, createPageUrl);
  };

  // Handle elements change
  const handleElementsChange = (newElements) => {
    if (!mode.isReadOnly) {
      saveToHistory(newElements);
    }
  };

  // Handle description modal
  const handleDescription = () => {
    setShowDescriptionModal(true);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded-lg"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Header */}
        <DrillLabHeader
          drillName={drillData.name}
          mode={mode.mode}
          isReadOnly={mode.isReadOnly}
          isLoading={isLoading}
        />

        {/* Toolbar */}
        <DrillLabToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onClear={handleClear}
          onBack={handleBack}
          onDescription={handleDescription}
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          isSaving={isSaving}
          isReadOnly={mode.isReadOnly}
          mode={mode.mode}
          isLoading={isLoading}
          backButtonText={backButtonConfig.text}
          backButtonAction={backButtonConfig.action}
        />

        {/* Canvas */}
        <DrillLabCanvas
          initialElements={currentElements}
          onElementsChange={handleElementsChange}
          isLoading={isLoading}
          isReadOnly={mode.isReadOnly}
          activeTool={activeTool}
        />
      </div>

      {/* Modals */}
      <DrillDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        description={drillData.description}
        drillName={drillData.name}
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