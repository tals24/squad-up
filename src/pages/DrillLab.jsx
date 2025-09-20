
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Trash2, Save, ArrowLeft, FileText, View } from 'lucide-react';
import DrillLabToolbar from '../components/DrillLabToolbar';
import DrillCanvas from '../components/DrillCanvas';
import DrillDescriptionModal from '../components/DrillDescriptionModal';
import { getDrills, updateDrill } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";

export default function DrillLab() {
  const [searchParams] = useSearchParams();
  // const navigate = useNavigate(); // Removed as per outline
  const drillId = searchParams.get('drillId');
  const mode = searchParams.get('mode'); // 'create' for new drill
  const returnTo = searchParams.get('returnTo');
  const isReadOnly = searchParams.get('readOnly') === 'true';

  const [activeTool, setActiveTool] = useState('select');
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [initialElements, setInitialElements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [drillDescription, setDrillDescription] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const canvasRef = useRef(null);

  useEffect(() => {
    if (drillId) {
      // טעינת תרגיל קיים
      const fetchDrillData = async () => {
        setIsLoading(true);
        const response = await getDrills();
        if (response.data?.record) {
          const drill = response.data.record;
          setDrillDescription(drill.Description || drill.DrillDescription || '');
          if (drill.DrillLayoutData) {
            try {
              const layoutElements = JSON.parse(drill.DrillLayoutData);
              setInitialElements(layoutElements);
              setHistory([layoutElements]);
              setHistoryIndex(0);
            } catch (e) {
              console.error("Failed to parse DrillLayoutData", e);
              setInitialElements([]);
            }
          }
        }
        setIsLoading(false);
      };
      fetchDrillData();
    } else {
      // מצב יצירה חדש
      setIsLoading(false);
    }
  }, [drillId]);

  // Removed useCallback wrapper as per outline
  const saveToHistory = (elements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // New handler for DrillCanvas shape updates
  const handleUpdateShapes = (newShapes) => {
    saveToHistory(newShapes);
  };

  // Removed useCallback wrapper as per outline
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  // Removed useCallback wrapper as per outline
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Restore these two functions for drag & drop
  // Removed useCallback wrapper as per outline
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Removed useCallback wrapper as per outline
  const handleDrop = (e) => {
    e.preventDefault();
    if (isReadOnly) return; // Prevent dropping in read-only mode

    const fromToolbar = e.dataTransfer.getData('fromToolbar');
    if (fromToolbar === 'true') {
        const shapeType = e.dataTransfer.getData('shape/type');
        if (shapeType && canvasRef.current) {
            canvasRef.current.addShape(shapeType, e.clientX, e.clientY);
        }
    }
  };


  const handleSave = async () => {
    setIsSaving(true);
    const elementsToSave = canvasRef.current?.getElements();
    
    if (mode === 'create' && returnTo === 'drillLibrary') {
      // מצב יצירה - שליחת המידע חזרה לטופס
      if (window.opener) {
        window.opener.postMessage({
          type: 'DRILL_LAB_SAVE',
          elements: elementsToSave
        }, window.location.origin);
        window.close();
      }
      return;
    }

    // מצב עדכון תרגיל קיים
    if (!drillId || isReadOnly) return;
    
    if (elementsToSave) {
      const response = await updateDrill({
        recordId: drillId,
        recordData: {
          DrillLayoutData: JSON.stringify(elementsToSave)
        }
      });
      if (response.data?.success) {
        setConfirmationConfig({
            type: 'success',
            title: 'Tactic Board Saved! 🚀',
            message: 'Your drill diagram has been successfully saved.'
        });
        setShowConfirmation(true);
        
        // Removed navigation logic as `navigate` is no longer available
        // if (returnTo === 'drillLibrary') {
        //   setTimeout(() => {
        //     navigate(createPageUrl('DrillLibrary'));
        //   }, 2000);
        // }
      } else {
         setConfirmationConfig({
            type: 'error',
            title: 'Save Failed',
            message: 'Could not save the diagram. Please try again.'
        });
        setShowConfirmation(true);
      }
    }
    setIsSaving(false);
  };

  const handleClear = () => {
    if (isReadOnly) return;
    saveToHistory([]);
  };

  const handleBackToLibrary = () => {
    // Removed navigation logic as `navigate` is no longer available
    // navigate(createPageUrl('DrillLibrary'));
    // The button will now do nothing unless an alternative action is added
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-bg-primary">
        <div className="text-text-primary text-xl animate-pulse">Loading Tactic Board...</div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden bg-bg-primary">
        <DrillCanvas 
          ref={canvasRef} 
          activeTool={activeTool} 
          shapes={history[historyIndex]} // Changed from initialElements
          onUpdateShapes={handleUpdateShapes} // Changed from onElementsChange
          isReadOnly={isReadOnly}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 p-3 bg-bg-secondary/95 backdrop-blur-sm rounded-xl shadow-xl border border-border-custom">
            {!isReadOnly && <DrillLabToolbar activeTool={activeTool} onToolSelect={setActiveTool} />}
            
            {isReadOnly && (
                <div className="flex items-center gap-2 text-warning font-semibold px-2">
                    <View className="w-5 h-5"/>
                    <span>Read-Only Mode</span>
                </div>
            )}
            
            <div className="w-px h-8 bg-bg-secondary mx-2"></div>
            
            <Button 
              onClick={handleUndo} 
              variant="outline" 
              size="icon"
              disabled={historyIndex <= 0 || isReadOnly}
              className="border-border-custom text-text-primary hover:bg-bg-secondary hover:text-text-primary disabled:opacity-50"
            >
              <Undo className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleRedo} 
              variant="outline" 
              size="icon"
              disabled={historyIndex >= history.length - 1 || isReadOnly}
              className="border-border-custom text-text-primary hover:bg-bg-secondary hover:text-text-primary disabled:opacity-50"
            >
              <Redo className="w-4 h-4" />
            </Button>

            {!isReadOnly && <div className="w-px h-8 bg-bg-secondary mx-2"></div>}

            <Button 
              onClick={() => setShowDescriptionModal(true)} 
              variant="outline" 
              size="sm"
              className="border-blue-600 text-accent-primary hover:bg-blue-600 hover:text-text-primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Description
            </Button>

            {!isReadOnly && (
              <Button 
                onClick={handleSave} 
                variant="outline" 
                size="sm"
                disabled={isSaving}
                className="border-green-600 text-success hover:bg-green-600 hover:text-text-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}

            {!isReadOnly && <div className="w-px h-8 bg-bg-secondary mx-2"></div>}
            
            <Button 
              onClick={handleClear} 
              variant="outline" 
              size="icon"
              disabled={isReadOnly}
              className="border-red-600 text-error hover:bg-red-600 hover:text-text-primary"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-8 bg-bg-secondary mx-2"></div>
            
            <Button 
              onClick={handleBackToLibrary}
              variant="outline" 
              size="sm"
              className="border-border-custom text-text-primary hover:bg-bg-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </div>
        </div>
      </div>

      <DrillDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        description={drillDescription}
        onSave={setDrillDescription}
        isReadOnly={isReadOnly} // Changed from true to dynamic prop
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
