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
  Search,
  Plus, // Added Plus icon
  Loader2 // Added Loader2 icon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Button } from "@/shared/ui/primitives/button";
import { Badge } from "@/shared/ui/primitives/badge";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/primitives/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/primitives/select";
import { useData } from "@/app/providers/DataProvider";
import { getFormations, createFormation, updateFormation, deleteFormation, createTimelineEvent } from "@/api/functions";
import ConfirmationToast from "@/shared/components/ConfirmationToast";
import FormationEditorModal from "@/shared/components/FormationEditorModal";

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
  const [isSaving, setIsSaving] = useState(false); // Used for saving performance data
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const [gameSize, setGameSize] = useState("11-a-side");
  const [selectedFormation, setSelectedFormation] = useState("1-4-3-3");
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formation, setFormation] = useState({});
  const [customFormations, setCustomFormations] = useState([]);
  const [showFormationModal, setShowFormationModal] = useState(false); // Controls FormationEditorModal

  const [isEditingFormation, setIsEditingFormation] = useState(false);
  const [editingFormationData, setEditingFormationData] = useState(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formationToDelete, setFormationToDelete] = useState(null);

  const [showSaveFormationModal, setShowSaveFormationModal] = useState(false); // Controls Save Board Layout modal
  const [saveFormationName, setSaveFormationName] = useState("");
  const [savedFormations, setSavedFormations] = useState([]);
  const [isSavingFormation, setIsSavingFormation] = useState(false); // Used for saving actual formation templates or board layouts
  const [currentTeamId, setCurrentTeamId] = useState(null);

  const [editingFormationName, setEditingFormationName] = useState("");

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const initializeFormation = useCallback(() => {
    const numPositions = gameSize === "9-a-side" ? 9 : 11;
    const newFormation = {};
    for (let i = 1; i <= numPositions; i++) {
      newFormation[i] = null;
    }
    setFormation(newFormation);
  }, [gameSize]);

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

      const response = await getFormations();

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
  }, [currentUser, teams, users]); // Removed 'players' dependency as it's not used in the function

  useEffect(() => {
    if (currentUser && teams.length > 0) {
      loadSavedFormations();
    }
  }, [currentUser, teams, players, loadSavedFormations]);

  useEffect(() => {
    if (gameSize === "9-a-side") {
        setSelectedFormation("1-3-3-2");
    } else {
        setSelectedFormation("1-4-3-3");
    }
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

  const handleSaveFormation = async () => { // This function saves the current board layout
    if (!saveFormationName.trim() || isSavingFormation) return;

    setIsSavingFormation(true);
    try {
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

      const response = await createFormation(recordData);

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
      setSelectedFormation(savedFormationRecord.id);

      setIsEditingFormation(false);
      setEditingFormationData(null);
      setEditingFormationName("");
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
    const customFormationToEdit = customFormations.find(f => f.name === selectedFormation && f.gameSize === gameSize);
    if (customFormationToEdit) {
        setEditingFormationData({ ...customFormationToEdit });
        setEditingFormationName(customFormationToEdit.name);
        setIsEditingFormation(true);
        return;
    }

    const airtableFormationToEdit = savedFormations.find(f => f.id === selectedFormation);
    if (airtableFormationToEdit) {
        try {
            const layout = JSON.parse(airtableFormationToEdit.FormationLayout);
            if (layout.defenders !== undefined && layout.midfielders !== undefined && layout.forwards !== undefined) {
                setEditingFormationData({
                    id: airtableFormationToEdit.id,
                    name: airtableFormationToEdit.FormationName,
                    defenders: layout.defenders,
                    midfielders: layout.midfielders,
                    forwards: layout.forwards,
                    positions: layout.positions || { 1: 'GK' },
                    gameSize: airtableFormationToEdit.GameSize,
                });
                setEditingFormationName(airtableFormationToEdit.FormationName);
                setIsEditingFormation(true);
            } else {
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
        const response = await deleteFormation(formationToDelete.id);

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
    const formationWithGameSize = {
      ...newFormation,
      gameSize,
      positions: { 1: 'GK' }
    };

    setEditingFormationData(formationWithGameSize);
    setEditingFormationName(newFormation.name || "");
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
      const isUpdating = !!editingFormationData.id;
      if (!editingFormationName.trim()) {
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
        const formationLayout = JSON.stringify({
          players: {},
          gameSize: gameSize,
          defenders: editingFormationData.defenders,
          midfielders: editingFormationData.midfielders,
          forwards: editingFormationData.forwards,
          positions: editingFormationData.positions
        });

        const recordData = {
          FormationName: editingFormationName.trim(),
          GameSize: gameSize,
          FormationLayout: formationLayout,
        };

        if (currentTeamId && !isUpdating) {
          recordData.Team = [currentTeamId];
        }

        let response;
        if (isUpdating) {
            response = await updateFormation(editingFormationData.id, recordData);
        } else {
            response = await createFormation(recordData);
        }

        if (response.data?.success) {
          setIsEditingFormation(false);
          setEditingFormationData(null);
          setEditingFormationName("");

          await loadSavedFormations();

          setSelectedFormation(response.data.record.id);
          initializeFormation();

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
    setEditingFormationName("");
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

  const _calculatePositions = useCallback((isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations) => {
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
          if (gameSize === "9-a-side") {
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
          } else {
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
        } else {
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
    } else {
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
        } else {
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
  }, []);

  const positions = useMemo(() => {
    return _calculatePositions(isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations);
  }, [isEditingFormation, editingFormationData, customFormations, selectedFormation, gameSize, savedFormations, _calculatePositions]);

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
    setIsSaving(true); // Using general isSaving for this operation

    try {
      const eventData = {
        player: selectedPlayer ? selectedPlayer._id : null,
        type: "Game Report",
        title: `Performance Report - ${selectedPlayer?.fullName}`,
        content: performanceData.GeneralNotes || "",
        rating: parseInt(performanceData.GeneralRating) || 3,
        minutesPlayed: parseInt(performanceData.MinutesPlayed) || 0,
        goals: parseInt(performanceData.Goals) || 0,
        assists: parseInt(performanceData.Assists) || 0,
        date: new Date().toISOString()
      };

      const response = await createTimelineEvent(eventData);

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
      'Goalkeeper': 'bg-purple-500',
      'Defender': 'bg-blue-500',
      'Midfielder': 'bg-green-500',
      'Forward': 'bg-red-500'
    };
    return colors[position] || 'bg-muted';
  };

  const isCurrentFormationCustom = useMemo(() => {
    return customFormations.some(f => f.name === selectedFormation && f.gameSize === gameSize) ||
           savedFormations.some(f => f.id === selectedFormation && f.GameSize === gameSize);
  }, [selectedFormation, customFormations, savedFormations, gameSize]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-20 bg-card rounded-xl shadow-sm"></div>
            <div className="h-24 bg-card rounded-xl shadow-sm"></div>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="h-96 bg-card rounded-xl shadow-sm"></div>
              <div className="lg:col-span-3 h-96 bg-card rounded-xl shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header - NEW CONTENT FROM OUTLINE */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Tactic <span className="text-primary">Board</span>
              </h1>
              <p className="text-muted-foreground text-lg">Create and manage team formations</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFormationModal(true)}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Formation
              </Button>
              <Button
                onClick={() => setShowSaveFormationModal(true)} // Opens the "Save Board Layout as Formation" modal
                disabled={isSavingFormation || Object.values(formation).every(player => !player)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSavingFormation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Formation
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Controls (Game Size, Formation Select, Edit/Delete, etc.) - WRAPPED IN A CARD */}
          <Card className="p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold text-foreground">
                {isEditingFormation
                  ? `Editing Formation: ${editingFormationName || 'New Custom Formation'}`
                  : `Current Formation`
                }
              </CardTitle>
              <p className="text-muted-foreground">
                 {isEditingFormation
                    ? 'Click empty circles to assign positions'
                    : `Drag players to build your formation (${
                        savedFormations.find(f => f.id === selectedFormation)?.FormationName || selectedFormation
                      })`
                  }
              </p>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {isEditingFormation ? (
                <div className="flex items-center gap-4 flex-1">
                  <Input
                    value={editingFormationName}
                    onChange={(e) => setEditingFormationName(e.target.value)}
                    placeholder="Enter formation name..."
                    className="max-w-xs bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <Badge className="bg-yellow-500 text-black">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Editing Mode
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground text-sm">Game Size:</Label>
                    <Select value={gameSize} onValueChange={setGameSize}>
                      <SelectTrigger className="w-32 bg-card border-border text-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="9-a-side" className="text-foreground">9-a-side</SelectItem>
                        <SelectItem value="11-a-side" className="text-foreground">11-a-side</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground text-sm">Formation:</Label>
                    <Select value={selectedFormation} onValueChange={handleFormationChange}>
                      <SelectTrigger className="w-48 bg-card border-border text-foreground text-sm">
                        <SelectValue>
                          {savedFormations.find(f => f.id === selectedFormation)?.FormationName || selectedFormation}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {getFormationOptions().map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-foreground">
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
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              )}
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
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                isCurrentFormationCustom && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleEditCurrentFormation}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
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
                )
              )}
            </CardContent>
          </Card>

          {/* Sidebar and Pitch - NOW IN A GRID */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Available Players Sidebar */}
            <Card className="col-span-1 flex flex-col h-full min-h-[400px]">
              <div className="flex-shrink-0 p-4 border-b border-border space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-blue" />
                  <h3 className="font-semibold text-foreground">Available Players</h3>
                  <div className="ml-auto bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">
                    {availablePlayers.length}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-9"
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
                            ? 'bg-secondary/30 opacity-50 cursor-not-allowed'
                            : `cursor-pointer hover:bg-accent ${
                                draggedPlayer?.id === player.id ? 'opacity-50 bg-accent' : 'bg-secondary/30 hover:bg-accent'
                              }`
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getPositionColor(player.Position)}`}>
                          {player.KitNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {player.FullName}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {player.Position}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {isEditingFormation ? "Players hidden during formation editing" : "All players are on the pitch"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Tactic Board Pitch */}
            <Card className="col-span-3 flex flex-col h-full min-h-[400px]">
              <div className="flex-shrink-0 p-4 bg-card border-b border-border flex items-center justify-between">
                {isEditingFormation ? (
                  <div className="flex items-center gap-4 flex-1">
                    <Input
                      value={editingFormationName}
                      onChange={(e) => setEditingFormationName(e.target.value)}
                      placeholder="Enter formation name..."
                      className="max-w-xs bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Badge className="bg-yellow-500 text-black">
                      <Edit3 className="w-3 h-3 mr-1" />
                      Editing Mode
                    </Badge>
                  </div>
                ) : (
                  <h3 className="text-lg font-semibold text-foreground">
                    Formation ({savedFormations.find(f => f.id === selectedFormation)?.FormationName || selectedFormation}) - {formationPlayers.length}/{gameSize === "9-a-side" ? 9 : 11} Players
                  </h3>
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
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showSaveFormationModal} onOpenChange={setShowSaveFormationModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Save className="w-5 h-5 text-brand-blue" />
              Save Board Layout as Formation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">Enter a name for this formation layout:</p>
            <Input
              value={saveFormationName}
              onChange={(e) => setSaveFormationName(e.target.value)}
              placeholder="e.g., My Favorite Game Plan"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveFormation()}
            />
            <div className="text-sm text-muted-foreground">
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
              className="border-border text-muted-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFormation}
              disabled={!saveFormationName.trim() || isSavingFormation}
              variant="default"
            >
              {isSavingFormation ? "Saving..." : "Save Board Layout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-blue" />
              Performance Data - {selectedPlayer?.FullName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePerformanceSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minutes" className="text-muted-foreground">Minutes Played</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={performanceData.MinutesPlayed}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, MinutesPlayed: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals" className="text-muted-foreground">Goals</Label>
                <Input
                  id="goals"
                  type="number"
                  min="0"
                  value={performanceData.Goals}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, Goals: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assists" className="text-muted-foreground">Assists</Label>
                <Input
                  id="assists"
                  type="number"
                  min="0"
                  value={performanceData.Assists}
                  onChange={(e) => setPerformanceData(prev => ({ ...prev, Assists: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setPerformanceData(prev => ({ ...prev, GeneralRating: rating }))}
                      className={`text-2xl transition-colors duration-200 ${
                        rating <= performanceData.GeneralRating ? 'text-yellow-400' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-muted-foreground">Player Notes</Label>
              <Textarea
                id="notes"
                value={performanceData.GeneralNotes}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, GeneralNotes: e.target.value }))}
                placeholder="Add performance notes..."
                className="bg-background border-border text-foreground placeholder:text-muted-foreground h-20"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPerformanceModal(false)}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                variant="default"
              >
                {isSaving ? "Saving..." : "Save Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPositionModal} onOpenChange={setShowPositionModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-blue" />
              Assign Position
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">Choose a position for this spot:</p>
            <div className="grid grid-cols-3 gap-2">
              {getAvailablePositions().map((position) => (
                <Button
                  key={position.value}
                  variant="outline"
                  onClick={() => handleAssignPosition(position.value)}
                  className="justify-center border-border text-muted-foreground hover:bg-accent hover:text-foreground font-bold"
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
              className="border-border text-muted-foreground hover:bg-accent"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Delete Formation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{formationToDelete?.name || formationToDelete?.FormationName}"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              className="border-border text-muted-foreground hover:bg-accent"
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