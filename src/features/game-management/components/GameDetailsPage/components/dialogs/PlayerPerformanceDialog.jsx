import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Textarea } from "@/shared/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/primitives/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Badge } from "@/shared/ui/primitives/badge";
import { AlertCircle, FileText, ShieldAlert, Plus, Trash2 } from "lucide-react";

import { calculateTotalMatchDuration } from "../../../../utils/minutesValidation";
import {
  fetchPlayerDisciplinaryActions,
  createDisciplinaryAction,
  deleteDisciplinaryAction,
} from "../../../../api/disciplinaryActionsApi";

export default function PlayerPerformanceDialog({ 
  open, 
  onOpenChange, 
  player, 
  data, 
  onDataChange, 
  onSave, 
  isReadOnly,
  isStarting = false,
  game,
  matchDuration,
}) {
  if (!player) return null;

  const [errorMessage, setErrorMessage] = useState("");
  const [disciplinaryActions, setDisciplinaryActions] = useState([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [newAction, setNewAction] = useState({
    cardType: 'yellow',
    minute: '',
    reason: '',
    foulsCommitted: '',
    foulsReceived: ''
  });

  const minutesPlayed = useMemo(() => Number(data?.minutesPlayed || 0), [data]);
  // Use matchDuration prop if available (real-time from header), otherwise fallback to game.matchDuration
  const maxMinutes = useMemo(() => {
    const duration = matchDuration || game?.matchDuration;
    return calculateTotalMatchDuration(duration);
  }, [matchDuration, game]);

  // Fetch disciplinary actions when dialog opens
  useEffect(() => {
    if (open && player && game?._id) {
      loadDisciplinaryActions();
    }
  }, [open, player, game]);

  const loadDisciplinaryActions = async () => {
    if (!game?._id || !player?._id) return;
    
    setIsLoadingActions(true);
    try {
      const actions = await fetchPlayerDisciplinaryActions(game._id, player._id);
      setDisciplinaryActions(actions);
    } catch (error) {
      console.error('Error loading disciplinary actions:', error);
    } finally {
      setIsLoadingActions(false);
    }
  };

  const handleAddDisciplinaryAction = async () => {
    if (!newAction.minute || !newAction.cardType) {
      setErrorMessage("Card type and minute are required");
      return;
    }

    try {
      const actionData = {
        playerId: player._id,
        cardType: newAction.cardType,
        minute: parseInt(newAction.minute),
        reason: newAction.reason || '',
        foulsCommitted: newAction.foulsCommitted ? newAction.foulsCommitted : '0',
        foulsReceived: newAction.foulsReceived ? newAction.foulsReceived : '0'
      };

      await createDisciplinaryAction(game._id, actionData);
      await loadDisciplinaryActions();
      
      // Reset form
      setNewAction({
        cardType: 'yellow',
        minute: '',
        reason: '',
        foulsCommitted: '',
        foulsReceived: ''
      });
      setErrorMessage("");
    } catch (error) {
      console.error('Error adding disciplinary action:', error);
      setErrorMessage(error.response?.data?.message || "Failed to add disciplinary action");
    }
  };

  const handleDeleteDisciplinaryAction = async (actionId) => {
    try {
      await deleteDisciplinaryAction(game._id, actionId);
      await loadDisciplinaryActions();
    } catch (error) {
      console.error('Error deleting disciplinary action:', error);
      setErrorMessage("Failed to delete disciplinary action");
    }
  };

  const handleSaveClick = () => {
    // Validate starting lineup player must have minutes > 0
    if (isStarting && minutesPlayed <= 0) {
      setErrorMessage("Starting lineup players must have minutes played (greater than 0).");
      return;
    }
    
    // Validate player cannot exceed match duration
    if (minutesPlayed > maxMinutes) {
      setErrorMessage(`Player cannot play more than ${maxMinutes} minutes (match duration + extra time).`);
      return;
    }
    
    setErrorMessage("");
    onSave();
  };

  const getCardBadgeColor = (cardType) => {
    switch (cardType) {
      case 'yellow': return 'bg-yellow-500 text-black';
      case 'red': return 'bg-red-500 text-white';
      case 'second-yellow': return 'bg-orange-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white">
              {player.kitNumber || "?"}
            </div>
            <div>
              <div className="text-lg font-bold">{player.fullName}</div>
              <div className="text-sm text-slate-400">{player.position}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="performance" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
              <FileText className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="disciplinary" className="data-[state=active]:bg-slate-700">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Disciplinary
              {disciplinaryActions.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {disciplinaryActions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
          {/* Minutes Played */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">
              Minutes Played
              <span className="text-xs text-slate-500 ml-2">(Max: {maxMinutes} min)</span>
            </label>
            <Input
              type="number"
              min="0"
              max={maxMinutes}
              value={data.minutesPlayed}
              onChange={(e) => {
                onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 });
                setErrorMessage(""); // Clear error when user types
              }}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
            {errorMessage && (
              <div className="mt-1 text-xs text-red-400">{errorMessage}</div>
            )}
          </div>

          {/* Note: Goals and Assists are now tracked via the Goal Dialog in the sidebar */}

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">General Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !isReadOnly && onDataChange({ ...data, rating: star })}
                  disabled={isReadOnly}
                  className={`
                    text-2xl transition-all
                    ${data.rating >= star ? "text-yellow-400" : "text-slate-600"}
                    ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110" : ""}
                  `}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Performance Notes</label>
            <Textarea
              value={data.notes}
              onChange={(e) => onDataChange({ ...data, notes: e.target.value })}
              disabled={isReadOnly}
              placeholder="Detailed observations about player performance..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>
          </TabsContent>

          {/* Disciplinary Tab */}
          <TabsContent value="disciplinary" className="space-y-4 mt-4">
            {/* Existing Disciplinary Actions */}
            {isLoadingActions ? (
              <div className="text-center py-8 text-slate-400">Loading disciplinary actions...</div>
            ) : disciplinaryActions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No disciplinary actions recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Disciplinary Actions</h3>
                {disciplinaryActions.map((action) => (
                  <div
                    key={action._id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={getCardBadgeColor(action.cardType)}>
                        {action.cardType === 'yellow' && '🟨'}
                        {action.cardType === 'red' && '🟥'}
                        {action.cardType === 'second-yellow' && '🟨🟥'}
                        {' '}
                        {action.cardType.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm text-white">
                          Minute {action.minute}'
                        </div>
                        {action.reason && (
                          <div className="text-xs text-slate-400">{action.reason}</div>
                        )}
                        {(action.foulsCommitted !== '0' || action.foulsReceived !== '0') && (
                          <div className="text-xs text-slate-500">
                            Fouls: {action.foulsCommitted} committed, {action.foulsReceived} received
                          </div>
                        )}
                      </div>
                    </div>
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDisciplinaryAction(action._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Disciplinary Action Form */}
            {!isReadOnly && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Disciplinary Action
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Card Type *</label>
                      <Select
                        value={newAction.cardType}
                        onValueChange={(value) => setNewAction(prev => ({ ...prev, cardType: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="yellow" className="text-white">🟨 Yellow</SelectItem>
                          <SelectItem value="red" className="text-white">🟥 Red</SelectItem>
                          <SelectItem value="second-yellow" className="text-white">🟨🟥 Second Yellow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Minute *</label>
                      <Input
                        type="number"
                        min="1"
                        max={maxMinutes}
                        value={newAction.minute}
                        onChange={(e) => setNewAction(prev => ({ ...prev, minute: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Fouls Committed</label>
                      <Select
                        value={newAction.foulsCommitted}
                        onValueChange={(value) => setNewAction(prev => ({ ...prev, foulsCommitted: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="0" className="text-white">0</SelectItem>
                          <SelectItem value="1-2" className="text-white">1-2</SelectItem>
                          <SelectItem value="3-4" className="text-white">3-4</SelectItem>
                          <SelectItem value="5+" className="text-white">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Fouls Received</label>
                      <Select
                        value={newAction.foulsReceived}
                        onValueChange={(value) => setNewAction(prev => ({ ...prev, foulsReceived: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="0" className="text-white">0</SelectItem>
                          <SelectItem value="1-2" className="text-white">1-2</SelectItem>
                          <SelectItem value="3-4" className="text-white">3-4</SelectItem>
                          <SelectItem value="5+" className="text-white">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Reason (Optional)</label>
                    <Textarea
                      value={newAction.reason}
                      onChange={(e) => setNewAction(prev => ({ ...prev, reason: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white min-h-[60px]"
                      placeholder="Brief description of the incident..."
                      maxLength={200}
                    />
                  </div>

                  <Button
                    onClick={handleAddDisciplinaryAction}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Disciplinary Action
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {errorMessage && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          {isReadOnly ? (
            <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-400">
                Cancel
              </Button>
              <Button onClick={handleSaveClick} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
                Save Report
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

