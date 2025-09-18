
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import {
  Users,
  RotateCcw,
  Save,
  X,
  Star,
  Clock,
  Target,
  MessageSquare,
  PlusCircle,
  Edit3,
  Check,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "../components/DataContext";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";
import FormationEditorModal from "../components/FormationEditorModal";

export default function TacticBoard() {
  const { users, teams, players, isLoading } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    MinutesPlayed: 0,
    Goals: 0,
    Assists: 0,
    GeneralRating: 3,
    GeneralNotes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const [gameSize, setGameSize] = useState("11-a-side");
  const [selectedFormation, setSelectedFormation] = useState("1-4-3-3");
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formation, setFormation] = useState({});
  const [customFormations, setCustomFormations] = useState([]); // This state is now primarily for *newly created* templates before they are saved to Airtable. Saved ones are in 'savedFormations'.
  const [showFormationModal, setShowFormationModal] = useState(false);

  // New states for position assignment
  const [isEditingFormation, setIsEditingFormation] = useState(false);
  const [editingFormationData, setEditingFormationData] = useState(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formationToDelete, setFormationToDelete] = useState(null);

  // New states for formation saving/loading
  const [showSaveFormationModal, setShowSaveFormationModal] = useState(false);
  const [saveFormationName, setSaveFormationName] = useState("");
  const [savedFormations, setSavedFormations] = useState([]);
  const [isSavingFormation, setIsSavingFormation] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);

  // New state for editing formation name
  const [editingFormationName, setEditingFormationName] = useState("");

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const loadSavedFormations = useCallback(async () => {
    try {
      if (!currentUser) return;

      let teamId = null;
      const airtableUser = users.find(u =>
        u.Email && currentUser.email && u.Email.toLowerCase() === currentUser.email.toLowerCase()
      );

      if (airtableUser) {
        const airtableRole = airtableUser.Role;

        if (airtableRole === 'Coach') {
          const coachTeams = teams.filter(team =>
            team.Coach && team.Coach.includes(airtableUser.id)
          );
          if (coachTeams.length > 0) {
            teamId = coachTeams[0].id;
          }
        }
      }

      setCurrentTeamId(teamId);

      const response = await airtableSync({
        action: 'fetch',
        tableName: 'Formations'
      });

      if (response.data?.records) {
        const filteredFormations = response.data.records.filter(formation => {
          const formationTeamLink = formation.Team && formation.Team[0];
          if (currentUser.role === 'admin' || !teamId) {
            return true;
          }
          return formationTeamLink === teamId;
        });
        setSavedFormations(filteredFormations);
      }
    } catch (error) {
      console.error("Error loading saved formations:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Error Loading Formations',
        message: `Failed to load saved formations: ${error.message}`
      });
      setShowConfirmation(true);
    }
  }, [currentUser, users, teams]);

  // Load saved formations when component mounts and when current user/teams change
  useEffect(() => {
    if (currentUser && teams.length > 0) {
      loadSavedFormations();
    }
  }, [currentUser, teams, players, loadSavedFormations]); // Added players to dependency array in case player data affects team filtering

  const initializeFormation = useCallback(() => {
    const numPositions = gameSize === "9-a-side" ? 9 : 11;
    const newFormation = {};
    for (let i = 1; i <= numPositions; i++) {
      newFormation[i] = null;
    }
    setFormation(newFormation);
  }, [gameSize]);

  // This useEffect now ONLY handles changes to gameSize
  useEffect(() => {
    // When game size changes, select a default formation for that size.
    if (gameSize === "9-a-side") {
        setSelectedFormation("1-3-3-2");
    } else {
        setSelectedFormation("1-4-3-3");
    }
    // Also, clear the board and exit any editing mode.
    initializeFormation();
    setIsEditingFormation(false);
    setEditingFormationData(null);
    setEditingFormationName("");
  }, [gameSize, initializeFormation]);

  const { availablePlayers, formationPlayers } = useMemo(() => {
    if (!currentUser || users.length === 0) {
      return { availablePlayers: [], formationPlayers: [] };
    }

    let filteredPlayers = players;

    if (currentUser.role !== 'admin') {
      const airtableUser = users.find(u =>
        u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase()
      );
      const airtableRole = airtableUser?.Role;

      if (airtableRole === 'Coach' && airtableUser) {
        const coachTeams = teams.filter(team =>
          team.Coach && team.Coach.includes(airtableUser.id)
        );
        const teamIds = coachTeams.map(team => team.id);
        filteredPlayers = players.filter(player =>
          player.Team && teamIds.some(id => player.Team.includes(id))
        );
      } else if (airtableRole === 'Division Manager' && airtableUser?.Department) {
        const divisionTeams = teams.filter(team =>
          team.Division === airtableUser.Department
        );
        const teamIds = divisionTeams.map(team => team.id);
        filteredPlayers = players.filter(player =>
          player.Team && teamIds.some(id => player.Team.includes(id))
        );
      }
    }
    
    if (searchTerm) {
        filteredPlayers = filteredPlayers.filter(player =>
            player.FullName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    const playersInFormation = Object.values(formation).filter(Boolean);
    const formationPlayerIds = playersInFormation.map(p => p.id);

    const available = filteredPlayers.filter(player =>
      !formationPlayerIds.includes(player.id)
    );

    return {
      availablePlayers: available,
      formationPlayers: playersInFormation
    };
  }, [currentUser, users, teams, players, formation, searchTerm]);

  const handleSaveFormation = async () => {
    if (!saveFormationName.trim() || isSavingFormation) return;

    setIsSavingFormation(true);
    try {
      // The saved layout should represent players on the pitch and game size.
      const formationLayout = JSON.stringify({
        players: formation,
        gameSize: gameSize
      });

      const recordData = {
        FormationName: saveFormationName.trim(),
        GameSize: gameSize,
        FormationLayout: formationLayout,
      };

      if (currentTeamId) {
        recordData.Team = [currentTeamId];
      }

      const response = await airtableSync({
        action: 'create',
        tableName: 'Formations',
        recordData: recordData
      });

      if (response.data?.success) {
        setConfirmationConfig({
          type: 'success',
          title: 'Formation Saved! ⚽',
          message: `"${saveFormationName}" has been saved and can now be selected from the formation dropdown.`
        });
        setShowConfirmation(true);
        setShowSaveFormationModal(false);
        setSaveFormationName("");
        
        await loadSavedFormations();
      } else {
        throw new Error(response.data?.error || "Failed to save formation");
      }
    } catch (error) {
      console.error("Error saving formation:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Save Formation',
        message: `There was an issue saving the formation: ${error.message}`
      });
      setShowConfirmation(true);
    }
    setIsSavingFormation(false);
  };

  const loadSavedFormation = (savedFormationRecord) => {
    try {
      const formationData = JSON.parse(savedFormationRecord.FormationLayout);
      
      if (formationData.gameSize !== gameSize) {
        setGameSize(formationData.gameSize);
      } else {
        initializeFormation(); 
      }
      
      setFormation(formationData.players || {});
      setSelectedFormation(savedFormationRecord.id); // FIX: Set the ID, not the name
      
      setIsEditingFormation(false);
      setEditingFormationData(null);
      setEditingFormationName("");
      
      // Removed the confirmation popup
    } catch (error) {
      console.error("Error loading saved formation:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Load Formation',
        message: `There was an issue loading the formation: ${error.message}`
      });
      setShowConfirmation(true);
    }
  };

  const handleFormationChange = (value) => {
    if (value === "create_new") {
      setShowFormationModal(true);
    } else {
      const savedFormationRecord = savedFormations.find(f => f.id === value);
      if (savedFormationRecord) {
        loadSavedFormation(savedFormationRecord);
      } else {
        setSelectedFormation(value);
        initializeFormation();
        setIsEditingFormation(false);
        setEditingFormationData(null);
        setEditingFormationName("");
      }
    }
  };
  
  const handleEditCurrentFormation = () => {
    // Try finding in local custom formations first (not strictly needed with current custom formation flow, but good for robustness)
    const customFormationToEdit = customFormations.find(f => f.name === selectedFormation && f.gameSize === gameSize);
    if (customFormationToEdit) {
        setEditingFormationData({ ...customFormationToEdit });
        setEditingFormationName(customFormationToEdit.name); // Set for editing
        setIsEditingFormation(true);
        return;
    }

    // Try finding in Airtable saved formations
    const airtableFormationToEdit = savedFormations.find(f => f.id === selectedFormation);
    if (airtableFormationToEdit) {
        try {
            const layout = JSON.parse(airtableFormationToEdit.FormationLayout);
            // Ensure we have the structure needed for editing (defenders, midfielders, forwards)
            if (layout.defenders !== undefined && layout.midfielders !== undefined && layout.forwards !== undefined) {
                setEditingFormationData({
                    id: airtableFormationToEdit.id, // Important for update operation
                    name: airtableFormationToEdit.FormationName,
                    defenders: layout.defenders,
                    midfielders: layout.midfielders,
                    forwards: layout.forwards,
                    positions: layout.positions || { 1: 'GK' }, // Default GK if not explicitly set
                    gameSize: airtableFormationToEdit.GameSize,
                });
                setEditingFormationName(airtableFormationToEdit.FormationName); // Set for editing
                setIsEditingFormation(true);
            } else {
                // This formation was saved with only player positions, not the editable structure.
                setConfirmationConfig({
                    type: 'info',
                    title: 'Cannot Edit This Formation',
                    message: 'This formation was saved in a simple format and cannot be edited. Please create a new formation with a defined structure to enable editing.'
                });
                setShowConfirmation(true);
            }
        } catch (error) {
            console.error("Error parsing formation for editing:", error);
            setConfirmationConfig({
                type: 'error',
                title: 'Error Preparing Edit',
                message: 'Could not prepare this formation for editing. It might be corrupted or in an old format.'
            });
            setShowConfirmation(true);
        }
    } else {
        // Fallback for default formations (if selectedFormation matches a default value but no custom/airtable record is found)
        setConfirmationConfig({
            type: 'info',
            title: 'Cannot Edit Default Formation',
            message: 'Default formations (like 1-4-3-3) cannot be edited. Please create and save a custom formation to enable editing.'
        });
        setShowConfirmation(true);
    }
  };

  const handleDeleteCurrentFormation = async () => {
    const localCustomFormation = customFormations.find(f => f.name === selectedFormation && f.gameSize === gameSize);
    const airtableSavedFormation = savedFormations.find(f => f.id === selectedFormation && f.GameSize === gameSize);

    if (localCustomFormation) {
      setFormationToDelete(localCustomFormation);
    } else if (airtableSavedFormation) {
      setFormationToDelete(airtableSavedFormation);
    } else {
      setConfirmationConfig({
        type: 'error',
        title: 'Deletion Not Allowed',
        message: 'Default formations cannot be deleted.'
      });
      setShowConfirmation(true);
      return;
    }
    setShowDeleteConfirmation(true);
  };

  const handleDeleteFormation = async () => {
    if (!formationToDelete) return;

    let success = false;
    let message = '';
    const isAirtableFormation = formationToDelete.id && formationToDelete.FormationName && formationToDelete.GameSize && formationToDelete.FormationLayout;

    try {
      if (isAirtableFormation) {
        const response = await airtableSync({
          action: 'delete',
          tableName: 'Formations',
          recordId: formationToDelete.id
        });

        if (response.data?.success) {
          await loadSavedFormations();
          success = true;
          message = `"${formationToDelete.FormationName}" has been removed from your formation library (Airtable).`;
        } else {
          throw new Error(response.data?.error || "Failed to delete from Airtable");
        }
      } else {
        setCustomFormations(prev => prev.filter(f => f.name !== formationToDelete.name || f.gameSize !== formationToDelete.gameSize));
        success = true;
        message = `"${formationToDelete.name}" has been removed from your local formation library.`;
      }

      if (success) {
        if (selectedFormation === (isAirtableFormation ? formationToDelete.id : formationToDelete.name)) {
          setSelectedFormation(gameSize === "9-a-side" ? "1-3-3-2" : "1-4-3-3");
          initializeFormation();
        }
        
        setConfirmationConfig({
          type: 'success',
          title: 'Formation Deleted',
          message: message
        });
      }
    } catch (error) {
      console.error("Error deleting formation:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Delete Formation',
        message: `There was an issue deleting the formation: ${error.message}`
      });
    } finally {
      setShowDeleteConfirmation(false);
      setFormationToDelete(null);
      setShowConfirmation(true);
    }
  };

  const handleSaveCustomFormation = (newFormation) => {
    // When creating a brand new formation template, it starts with an empty template
    // This now correctly sets editingFormationData for a *new* creation
    const formationWithGameSize = {
      ...newFormation,
      gameSize,
      positions: { 1: 'GK' } // GK is always fixed
    };

    setEditingFormationData(formationWithGameSize);
    setEditingFormationName(newFormation.name || ""); // Initialize name for editing
    // Don't set selectedFormation here, as we're in editing mode.
    // The selection will happen after saving.
    setIsEditingFormation(true);
    setShowFormationModal(false);
  };

  const handlePositionClick = (positionId) => {
    if (isEditingFormation && !formation[positionId]) {
      setSelectedPositionId(positionId);
      setShowPositionModal(true);
    }
  };

  const handleAssignPosition = (positionLabel) => {
    if (editingFormationData && selectedPositionId) {
      const updatedFormationData = {
        ...editingFormationData,
        positions: {
          ...editingFormationData.positions,
          [selectedPositionId]: positionLabel
        }
      };
      setEditingFormationData(updatedFormationData);
      setShowPositionModal(false);
      setSelectedPositionId(null);
    }
  };

  const handleFinalizeFormation = async () => {
    if (editingFormationData) {
      const isUpdating = !!editingFormationData.id; // Check if an ID exists, indicating an update
      if (!editingFormationName.trim()) { // Ensure name is not empty
        setConfirmationConfig({
          type: 'error',
          title: 'Formation Name Required',
          message: 'Please enter a name for your custom formation.'
        });
        setShowConfirmation(true);
        return;
      }

      setIsSavingFormation(true);
      try {
        // This is saving the formation *template*.
        const formationLayout = JSON.stringify({
          players: {}, // This template does not include specific players
          gameSize: gameSize, // Use current gameSize for the layout, though editingFormationData.gameSize should also be current
          defenders: editingFormationData.defenders,
          midfielders: editingFormationData.midfielders,
          forwards: editingFormationData.forwards,
          positions: editingFormationData.positions
        });

        const recordData = {
          FormationName: editingFormationName.trim(), // Use the live edited name
          GameSize: gameSize, // Ensure gameSize is consistent
          FormationLayout: formationLayout,
        };

        if (currentTeamId && !isUpdating) { // Only assign team for new creations
          recordData.Team = [currentTeamId];
        }
        
        let response;
        if (isUpdating) {
            response = await airtableSync({
                action: 'update',
                tableName: 'Formations',
                recordId: editingFormationData.id,
                recordData: recordData
            });
        } else {
            response = await airtableSync({
                action: 'create',
                tableName: 'Formations',
                recordData: recordData
            });
        }

        if (response.data?.success) {
          setIsEditingFormation(false);
          setEditingFormationData(null);
          setEditingFormationName(""); // Clear editing name state
          
          await loadSavedFormations(); // Reload saved formations to include the new/updated one
          
          // Select the newly created/updated formation by its Airtable ID
          setSelectedFormation(response.data.record.id);
          initializeFormation(); // Clear the board, as we're now just managing the template

          setConfirmationConfig({
            type: 'success',
            title: isUpdating ? 'Formation Updated! ⚽' : 'Custom Formation Saved! ⚽',
            message: `"${editingFormationName.trim()}" has been successfully ${isUpdating ? 'updated' : 'saved'}.`
          });
          setShowConfirmation(true);
        } else {
          throw new Error(response.data?.error || `Failed to ${isUpdating ? 'update' : 'save'} formation`);
        }
      } catch (error) {
        console.error(`Error ${isUpdating ? 'updating' : 'saving'} custom formation:`, error);
        setConfirmationConfig({
          type: 'error',
          title: `Failed to ${isUpdating ? 'Update' : 'Save'} Formation`,
          message: `There was an issue saving the formation: ${error.message}`
        });
        setShowConfirmation(true);
      }
      setIsSavingFormation(false);
    }
  };

  const cancelFormationEdit = () => {
    setSelectedFormation(gameSize === "9-a-side" ? "1-3-3-2" : "1-4-3-3");
    setIsEditingFormation(false);
    setEditingFormationData(null);
    setEditingFormationName(""); // Clear editing name state
    initializeFormation();
  };

  const getFormationOptions = () => {
    const defaultOptions = gameSize === "9-a-side"
      ? [{ value: "1-3-3-2", label: "1-3-3-2" }, { value: "1-4-2-2", label: "1-4-2-2" }]
      : [{ value: "1-4-4-2", label: "1-4-4-2" }, { value: "1-4-3-3", label: "1-4-3-3" }];

    const customOptions = customFormations
      .filter(f => f.gameSize === gameSize)
      .map(f => ({ value: f.name, label: f.name }));

    const savedOptions = savedFormations
      .filter(f => f.GameSize === gameSize)
      .map(f => ({ value: f.id, label: f.FormationName }));

    return [...defaultOptions, ...customOptions, ...savedOptions];
  };

  // Helper function to calculate positions, extracting logic from useMemo
  const _calculatePositions = (isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations) => {
    if (isEditingFormation && editingFormationData) {
      let positions = { 1: { x: 50, y: 85, label: editingFormationData.positions?.[1] || 'GK' } };
      let positionIndex = 2;

      const distributeLine = (count, y) => {
        for (let i = 0; i < count; i++) {
          const positionId = positionIndex.toString();
          const assignedLabel = editingFormationData.positions?.[positionId] || 'POS';

          positions[positionIndex] = {
            x: (100 / (count + 1)) * (i + 1),
            y: y,
            label: assignedLabel
          };
          positionIndex++;
        }
      };

      distributeLine(editingFormationData.defenders, 65);
      distributeLine(editingFormationData.midfielders, 45);
      distributeLine(editingFormationData.forwards, 25);
      return positions;
    }

    const custom = customFormations.find(f => f.name === selectedFormation && f.gameSize === gameSize);
    if (custom) {
      let positions = { 1: { x: 50, y: 85, label: custom.positions?.[1] || 'GK' } };
      let positionIndex = 2;

      const distributeLine = (count, y) => {
        for (let i = 0; i < count; i++) {
          const positionId = positionIndex.toString();
          const assignedLabel = custom.positions?.[positionId] || 'POS';

          positions[positionIndex] = {
            x: (100 / (count + 1)) * (i + 1),
            y: y,
            label: assignedLabel
          };
          positionIndex++;
        }
      };

      distributeLine(custom.defenders, 65);
      distributeLine(custom.midfielders, 45);
      distributeLine(custom.forwards, 25);
      return positions;
    }

    const airtableSaved = savedFormations.find(f => f.id === selectedFormation && f.GameSize === gameSize);
    if (airtableSaved) {
      const parsedLayout = JSON.parse(airtableSaved.FormationLayout);
      
      if (parsedLayout.defenders !== undefined && parsedLayout.midfielders !== undefined && parsedLayout.forwards !== undefined) {
          let positions = { 1: { x: 50, y: 85, label: (parsedLayout.positions && parsedLayout.positions[1]) || 'GK' } };
          let positionIndex = 2;

          const distributeLine = (count, y, currentPositions) => {
            for (let i = 0; i < count; i++) {
              const positionId = positionIndex.toString();
              const assignedLabel = (currentPositions && currentPositions[positionId]) || 'POS';

              positions[positionIndex] = {
                x: (100 / (count + 1)) * (i + 1),
                y: y,
                label: assignedLabel
              };
              positionIndex++;
            }
          };

          distributeLine(parsedLayout.defenders, 65, parsedLayout.positions);
          distributeLine(parsedLayout.midfielders, 45, parsedLayout.positions);
          distributeLine(parsedLayout.forwards, 25, parsedLayout.positions);
          return positions;
      } else {
          // Fallback to a default visual for the game size if custom layout data is not present in Airtable save.
          // This ensures that board layouts saved with the simplified FormationLayout still display correctly.
          if (gameSize === "9-a-side") {
              return { // Default 9-a-side: 1-3-3-2
                  1: { x: 50, y: 85, label: 'GK' },
                  2: { x: 25, y: 65, label: 'LB' },
                  3: { x: 50, y: 65, label: 'CB' },
                  4: { x: 75, y: 65, label: 'RB' },
                  5: { x: 25, y: 45, label: 'LM' },
                  6: { x: 50, y: 45, label: 'CM' },
                  7: { x: 75, y: 45, label: 'RM' },
                  8: { x: 35, y: 25, label: 'LF' },
                  9: { x: 65, y: 25, label: 'RF' }
              };
          } else { // 11-a-side default: 1-4-3-3
              return {
                  1: { x: 50, y: 85, label: 'GK' },
                  2: { x: 75, y: 65, label: 'RB' },
                  3: { x: 60, y: 65, label: 'CB' },
                  4: { x: 40, y: 65, label: 'CB' },
                  5: { x: 25, y: 65, label: 'LB' },
                  6: { x: 65, y: 45, label: 'CM' },
                  7: { x: 50, y: 45, label: 'CM' },
                  8: { x: 35, y: 45, label: 'CM' },
                  9: { x: 75, y: 25, label: 'RW' },
                  10: { x: 50, y: 20, label: 'ST' },
                  11: { x: 25, y: 25, label: 'LW' }
              };
          }
      }
    }

    if (gameSize === "9-a-side") {
        if (selectedFormation === "1-3-3-2") {
            return {
                1: { x: 50, y: 85, label: 'GK' },
                2: { x: 25, y: 65, label: 'LB' },
                3: { x: 50, y: 65, label: 'CB' },
                4: { x: 75, y: 65, label: 'RB' },
                5: { x: 25, y: 45, label: 'LM' },
                6: { x: 50, y: 45, label: 'CM' },
                7: { x: 75, y: 45, label: 'RM' },
                8: { x: 35, y: 25, label: 'LF' },
                9: { x: 65, y: 25, label: 'RF' }
            };
        } else { // 1-4-2-2
            return {
                1: { x: 50, y: 85, label: 'GK' },
                2: { x: 20, y: 65, label: 'LB' },
                3: { x: 40, y: 65, label: 'CB' },
                4: { x: 60, y: 65, label: 'CB' },
                5: { x: 80, y: 65, label: 'RB' },
                6: { x: 40, y: 45, label: 'CM' },
                7: { x: 60, y: 45, label: 'CM' },
                8: { x: 35, y: 25, label: 'LF' },
                9: { x: 65, y: 25, label: 'RF' }
            };
        }
    } else { // 11-a-side
        if (selectedFormation === "1-4-4-2") {
            return {
                1: { x: 50, y: 85, label: 'GK' },
                2: { x: 75, y: 65, label: 'RB' },
                3: { x: 60, y: 65, label: 'CB' },
                4: { x: 40, y: 65, label: 'CB' },
                5: { x: 25, y: 65, label: 'LB' },
                6: { x: 75, y: 45, label: 'RM' },
                7: { x: 60, y: 45, label: 'CM' },
                8: { x: 40, y: 45, label: 'CM' },
                9: { x: 25, y: 45, label: 'LM' },
                10: { x: 40, y: 25, label: 'ST' },
                11: { x: 60, y: 25, label: 'ST' }
            };
        } else { // 1-4-3-3
            return {
                1: { x: 50, y: 85, label: 'GK' },
                2: { x: 75, y: 65, label: 'RB' },
                3: { x: 60, y: 65, label: 'CB' },
                4: { x: 40, y: 65, label: 'CB' },
                5: { x: 25, y: 65, label: 'LB' },
                6: { x: 65, y: 45, label: 'CM' },
                7: { x: 50, y: 45, label: 'CM' },
                8: { x: 35, y: 45, label: 'CM' },
                9: { x: 75, y: 25, label: 'RW' },
                10: { x: 50, y: 20, label: 'ST' },
                11: { x: 25, y: 25, label: 'LW' }
            };
        }
    }

    return {
        1: { x: 50, y: 85, label: 'GK' }
    };
  };

  const positions = useMemo(() => {
    return _calculatePositions(isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations);
  }, [isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations]);

  const getAvailablePositions = () => {
    if (!selectedPositionId || !editingFormationData) return [];

    const positionNumber = parseInt(selectedPositionId);
    let lineType = '';

    if (positionNumber === 1) {
      lineType = 'goalkeeper';
    } else {
      let currentIndex = 2;
      
      if (positionNumber >= currentIndex && positionNumber < currentIndex + editingFormationData.defenders) {
        lineType = 'defender';
      }
      currentIndex += editingFormationData.defenders;
      
      if (positionNumber >= currentIndex && positionNumber < currentIndex + editingFormationData.midfielders) {
        lineType = 'midfielder';
      }
      currentIndex += editingFormationData.midfielders;
      
      if (positionNumber >= currentIndex && positionNumber < currentIndex + editingFormationData.forwards) {
        lineType = 'forward';
      }
    }

    const positionsByLine = {
      goalkeeper: [
        { value: 'GK', label: 'GK' }
      ],
      defender: [
        { value: 'CB', label: 'CB' },
        { value: 'LB', label: 'LB' },
        { value: 'RB', label: 'RB' },
        { value: 'LWB', label: 'LWB' },
        { value: 'RWB', label: 'RWB' }
      ],
      midfielder: [
        { value: 'CDM', label: 'CDM' },
        { value: 'CM', label: 'CM' },
        { value: 'CAM', label: 'CAM' },
        { value: 'LM', label: 'LM' },
        { value: 'RM', label: 'RM' }
      ],
      forward: [
        { value: 'ST', label: 'ST' },
        { value: 'CF', label: 'CF' },
        { value: 'LW', label: 'LW' },
        { value: 'RW', label: 'RW' }
      ]
    };

    return positionsByLine[lineType] || [];
  };

  const handleDragStart = (e, player) => {
    setDraggedPlayer(player);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, positionId) => {
    e.preventDefault();
    if (draggedPlayer) {
      setFormation(prev => ({
        ...prev,
        [positionId]: draggedPlayer
      }));
      setDraggedPlayer(null);
      setIsDragging(false);
    }
  };

  const removeFromFormation = (positionId) => {
    setFormation(prev => ({
      ...prev,
      [positionId]: null
    }));
  };

  const clearFormation = () => {
    initializeFormation();
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setPerformanceData({
      MinutesPlayed: 0,
      Goals: 0,
      Assists: 0,
      GeneralRating: 3,
      GeneralNotes: ""
    });
    setShowPerformanceModal(true);
  };

  const handlePerformanceSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await airtableSync({
        action: 'create',
        tableName: 'TimelineEvents',
        recordData: {
          Player: selectedPlayer ? [selectedPlayer.id] : undefined,
          Date: new Date().toISOString().split('T')[0],
          EventType: "Game Report",
          GeneralRating: parseInt(performanceData.GeneralRating) || 3,
          MinutesPlayed: parseInt(performanceData.MinutesPlayed) || 0,
          Goals: parseInt(performanceData.Goals) || 0,
          Assists: parseInt(performanceData.Assists) || 0,
          GeneralNotes: performanceData.GeneralNotes || ""
        }
      });

      if (response.data?.success) {
        setConfirmationConfig({
          type: 'success',
          title: 'Performance Data Saved! ⚽',
          message: `Match data for ${selectedPlayer?.FullName} has been recorded successfully.`
        });
        setShowConfirmation(true);
        setShowPerformanceModal(false);
      } else {
        throw new Error(response.data?.error || "Failed to save performance data");
      }
    } catch (error) {
      console.error("Error saving performance data:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Save Data',
        message: `There was an issue saving the performance data: ${error.message}`
      });
      setShowConfirmation(true);
    }
    setIsSaving(false);
  };

  const getPositionColor = (position) => {
    const colors = {
      'Goalkeeper': 'bg-accent-secondary',
      'Defender': 'bg-accent-primary',
      'Midfielder': 'bg-success',
      'Forward': 'bg-error'
    };
    return colors[position] || 'bg-disabled-custom';
  };

  const isCurrentFormationCustom = useMemo(() => {
    return customFormations.some(f => f.name === selectedFormation && f.gameSize === gameSize) ||
           savedFormations.some(f => f.id === selectedFormation && f.GameSize === gameSize);
  }, [selectedFormation, customFormations, savedFormations, gameSize]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="h-96 bg-bg-secondary rounded-xl shadow-sm"></div>
              <div className="lg:col-span-3 h-96 bg-bg-secondary rounded-xl shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-bg-secondary border-b border-border-custom p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Tactic Board</h1>
                <p className="text-text-secondary">
                  {isEditingFormation
                    ? `Editing Formation: ${editingFormationName || 'New Custom Formation'} - Click empty circles to assign positions`
                    : `Drag players to build your formation (${gameSize})`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isEditingFormation ? (
                  <>
                    <Button
                      onClick={handleFinalizeFormation}
                      disabled={isSavingFormation || !editingFormationName.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isSavingFormation ? "Saving..." : "Save Custom Formation"}
                    </Button>
                    <Button
                      onClick={cancelFormationEdit}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-300 text-sm">Game Size:</Label>
                      <Select value={gameSize} onValueChange={setGameSize}>
                        <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="9-a-side" className="text-white">9-a-side</SelectItem>
                          <SelectItem value="11-a-side" className="text-white">11-a-side</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-300 text-sm">Formation:</Label>
                      <Select value={selectedFormation} onValueChange={handleFormationChange}>
                        <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue>
                            {savedFormations.find(f => f.id === selectedFormation)?.FormationName || selectedFormation}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {getFormationOptions().map(option => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="create_new" className="text-blue-400">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="w-4 h-4" />
                              <span>Create New Formation</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={clearFormation}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-slate-700 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-white">Available Players</h3>
                <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-300">
                  {availablePlayers.length}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {availablePlayers.length > 0 ? (
                  availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      draggable={!isEditingFormation}
                      onDragStart={(e) => !isEditingFormation && handleDragStart(e, player)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !isEditingFormation && handlePlayerClick(player)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        isEditingFormation
                          ? 'bg-slate-700/30 opacity-50 cursor-not-allowed'
                          : `cursor-pointer hover:bg-slate-700 ${
                              draggedPlayer?.id === player.id ? 'opacity-50 bg-slate-700' : 'bg-slate-700/30 hover:bg-slate-700'
                            }`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getPositionColor(player.Position)}`}>
                        {player.KitNumber || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {player.FullName}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {player.Position}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">
                      {isEditingFormation ? "Players hidden during formation editing" : "All players are on the pitch"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              {isEditingFormation ? (
                <div className="flex items-center gap-4 flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    Formation Name:
                  </h3>
                  <Input
                    value={editingFormationName}
                    onChange={(e) => setEditingFormationName(e.target.value)}
                    placeholder="Enter formation name..."
                    className="max-w-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <Badge className="bg-yellow-500 text-black">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Editing Mode
                  </Badge>
                </div>
              ) : (
                <h3 className="text-lg font-semibold text-white">
                  Formation ({savedFormations.find(f => f.id === selectedFormation)?.FormationName || selectedFormation}) - {formationPlayers.length}/{gameSize === "9-a-side" ? 9 : 11} Players
                </h3>
              )}
              {!isEditingFormation && isCurrentFormationCustom && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleEditCurrentFormation}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDeleteCurrentFormation}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <div className="w-full h-full bg-gradient-to-b from-green-600 to-green-800 rounded-xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full opacity-100"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-100"></div>

                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-100"></div>

                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/5 h-24 border-2 border-white border-b-0 rounded-t-lg opacity-100"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/5 h-24 border-2 border-white border-t-0 rounded-b-lg opacity-100"></div>

                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-12 border-2 border-white border-b-0 rounded-t-lg opacity-100"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/4 h-12 border-2 border-white border-t-0 rounded-b-lg opacity-100"></div>
                </div>

                {Object.entries(positions).map(([positionId, pos]) => {
                  const player = formation[positionId];
                  const isClickableForEdit = isEditingFormation && !player && positionId !== "1";

                  return (
                    <div
                      key={positionId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`
                      }}
                      onDragOver={!isEditingFormation ? handleDragOver : undefined}
                      onDrop={!isEditingFormation ? (e) => handleDrop(e, positionId) : undefined}
                    >
                      {player ? (
                        <div className="relative group">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white cursor-pointer ${getPositionColor(player.Position)} hover:scale-110 transition-transform duration-200`}
                            onClick={() => !isEditingFormation && handlePlayerClick(player)}
                          >
                            {player.KitNumber || '?'}
                          </div>
                          {!isEditingFormation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromFormation(positionId);
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-white text-xs font-medium text-center whitespace-nowrap bg-black bg-opacity-50 rounded px-2 py-1">
                            {player.FullName}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center text-white font-bold transition-all duration-200 ${
                            isClickableForEdit
                              ? 'border-yellow-400 bg-yellow-500/30 shadow-lg cursor-pointer hover:bg-yellow-500/50 hover:scale-110'
                              : isDragging ? 'border-blue-400 bg-blue-500/30 shadow-lg' : 'border-white'
                          }`}
                          onClick={isClickableForEdit ? () => handlePositionClick(positionId) : undefined}
                        >
                          <span className={`text-xs ${isEditingFormation && (editingFormationData?.positions?.[positionId] && positionId !== '1' || positionId === '1' ) ? 'text-yellow-200' : ''}`}>
                            {pos.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSaveFormationModal} onOpenChange={setShowSaveFormationModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-500" />
              Save Board Layout as Formation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-300">Enter a name for this formation layout:</p>
            <Input
              value={saveFormationName}
              onChange={(e) => setSaveFormationName(e.target.value)}
              placeholder="e.g., My Favorite Game Plan"
              className="bg-slate-700 border-slate-600 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveFormation()}
            />
            <div className="text-sm text-slate-400">
              Game Size: {gameSize} • Players on Board: {formationPlayers.length}/{gameSize === "9-a-side" ? 9 : 11}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveFormationModal(false);
                setSaveFormationName("");
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFormation}
              disabled={!saveFormationName.trim() || isSavingFormation}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSavingFormation ? "Saving..." : "Save Board Layout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Performance Data - {selectedPlayer?.FullName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePerformanceSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minutes" className="text-slate-300">Minutes Played</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={performanceData.MinutesPlayed}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, MinutesPlayed: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals" className="text-slate-300">Goals</Label>
                <Input
                  id="goals"
                  type="number"
                  min="0"
                  value={performanceData.Goals}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, Goals: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assists" className="text-slate-300">Assists</Label>
                <Input
                  id="assists"
                  type="number"
                  min="0"
                  value={performanceData.Assists}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, Assists: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setPerformanceData(prev => ({ ...prev, GeneralRating: rating }))}
                      className={`text-2xl transition-colors duration-200 ${
                        rating <= performanceData.GeneralRating ? 'text-yellow-400' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Player Notes</Label>
              <Textarea
                id="notes"
                value={performanceData.GeneralNotes}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, GeneralNotes: e.target.value }))}
                placeholder="Add performance notes..."
                className="bg-slate-700 border-slate-600 text-white h-20"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPerformanceModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSaving ? "Saving..." : "Save Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPositionModal} onOpenChange={setShowPositionModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Assign Position
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-300">Choose a position for this spot:</p>
            <div className="grid grid-cols-3 gap-2">
              {getAvailablePositions().map((position) => (
                <Button
                  key={position.value}
                  variant="outline"
                  onClick={() => handleAssignPosition(position.value)}
                  className="justify-center border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-bold"
                >
                  {position.label}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPositionModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Delete Formation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-300">
              Are you sure you want to delete "{formationToDelete?.name || formationToDelete?.FormationName}"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFormation}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Formation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormationEditorModal
        isOpen={showFormationModal}
        onClose={() => setShowFormationModal(false)}
        onSave={handleSaveCustomFormation}
        gameSize={gameSize}
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
