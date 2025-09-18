import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, Swords, Users } from "lucide-react";

export default function FormationEditorModal({ isOpen, onClose, onSave, gameSize }) {
  const [name, setName] = useState('');
  const [defenders, setDefenders] = useState(0);
  const [midfielders, setMidfielders] = useState(0);
  const [forwards, setForwards] = useState(0);
  const [error, setError] = useState('');

  const outfieldPlayers = gameSize === '9-a-side' ? 8 : 10;

  useEffect(() => {
    // Reset form when modal opens or game size changes
    setName('');
    setDefenders(0);
    setMidfielders(0);
    setForwards(0);
    setError('');
  }, [isOpen, gameSize]);

  useEffect(() => {
    const total = defenders + midfielders + forwards;
    if (total > outfieldPlayers) {
      setError(`Total players cannot exceed ${outfieldPlayers}. Current total: ${total}`);
    } else {
      setError('');
    }
  }, [defenders, midfielders, forwards, outfieldPlayers]);

  const handleSave = () => {
    const total = defenders + midfielders + forwards;
    if (name.trim() === '') {
      setError('Formation name is required.');
      return;
    }
    if (total !== outfieldPlayers) {
      setError(`Total players must equal ${outfieldPlayers}. Current total: ${total}`);
      return;
    }
    
    onSave({ name, defenders, midfielders, forwards });
  };
  
  const handleNumberChange = (setter, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setter(num);
    } else if (value === '') {
      setter(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-bg-secondary border-border-custom text-text-primary">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Formation</DialogTitle>
          <p className="text-sm text-text-secondary">Define a custom formation for {gameSize}.</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="formation-name">Formation Name</Label>
            <Input
              id="formation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom 4-4-2"
              className="bg-bg-secondary border-border-custom"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defenders" className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent-primary"/> Defenders</Label>
              <Input
                id="defenders"
                type="number"
                min="0"
                value={defenders}
                onChange={(e) => handleNumberChange(setDefenders, e.target.value)}
                className="bg-bg-secondary border-border-custom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midfielders" className="flex items-center gap-2"><Users className="w-4 h-4 text-success"/> Midfielders</Label>
              <Input
                id="midfielders"
                type="number"
                min="0"
                value={midfielders}
                onChange={(e) => handleNumberChange(setMidfielders, e.target.value)}
                className="bg-bg-secondary border-border-custom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forwards" className="flex items-center gap-2"><Swords className="w-4 h-4 text-error"/> Forwards</Label>
              <Input
                id="forwards"
                type="number"
                min="0"
                value={forwards}
                onChange={(e) => handleNumberChange(setForwards, e.target.value)}
                className="bg-bg-secondary border-border-custom"
              />
            </div>
          </div>
          
          <div className="p-3 bg-bg-secondary/50 rounded-lg text-center">
            <p className="text-sm text-text-primary">Total Outfield Players: <span className="font-bold text-text-primary">{defenders + midfielders + forwards} / {outfieldPlayers}</span></p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4"/>
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="border-border-custom text-text-primary hover:bg-bg-secondary">Cancel</Button>
          <Button type="button" onClick={handleSave} className="bg-accent-primary hover:bg-blue-600">Save Formation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}