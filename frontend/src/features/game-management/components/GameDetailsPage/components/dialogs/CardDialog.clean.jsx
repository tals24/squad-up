import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { Button } from '@/shared/ui/primitives/button';

import { useCardForm } from './modules/useCardForm';
import { CardForm } from './modules/CardForm';

export default function CardDialog({
  isOpen,
  onClose,
  onSave,
  card = null,
  gamePlayers = [],
  cards = [],
  matchDuration = 90,
  isReadOnly = false,
  game = null
}) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    cardData,
    setCardData,
    errors,
    setErrors,
    validationError,
    validateForm,
    getAvailableOptions,
  } = useCardForm(card, cards, gamePlayers, matchDuration, isOpen);

  const availableOptions = getAvailableOptions();

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave({
        _id: card?._id,
        playerId: cardData.playerId,
        cardType: cardData.cardType,
        minute: cardData.minute,
        reason: cardData.reason || ''
      });
      onClose();
    } catch (error) {
      const errorMessage = error.message || 'Failed to save card';
      setErrors({ submit: errorMessage });
      console.warn('Card validation failed:', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-yellow-400">
            <ShieldAlert className="w-6 h-6" />
            {isReadOnly ? 'View Card' : card ? 'Edit Card' : 'Add Card'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReadOnly
              ? 'View card details'
              : card
              ? 'Update card information'
              : 'Record a disciplinary card (Yellow, Red, or Second Yellow)'}
          </DialogDescription>
        </DialogHeader>

        <CardForm
          cardData={cardData}
          setCardData={setCardData}
          errors={errors}
          validationError={validationError}
          availableOptions={availableOptions}
          gamePlayers={gamePlayers}
          matchDuration={matchDuration}
          isReadOnly={isReadOnly}
          isEditing={!!card}
        />

        {/* Submit Error */}
        {errors.submit && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        <DialogFooter className="mt-6">
          {isReadOnly ? (
            <Button onClick={onClose} className="bg-gradient-to-r from-cyan-600 to-blue-600">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-400">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !!validationError}
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {isSaving ? 'Saving...' : card ? 'Update Card' : 'Add Card'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

