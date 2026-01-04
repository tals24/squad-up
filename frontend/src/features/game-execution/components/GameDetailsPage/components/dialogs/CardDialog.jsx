import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { BaseDialog } from "@/shared/ui/composed";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/primitives/radio-group";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { 
  canReceiveCard, 
  getAvailableCardOptions, 
  getRecommendedCardType 
} from "../../../../utils/cardValidation";

const CARD_TYPES = [
  { value: 'yellow', label: 'Yellow Card', emoji: '🟨' },
  { value: 'red', label: 'Red Card', emoji: '🟥' },
  { value: 'second-yellow', label: 'Second Yellow', emoji: '🟨🟥' }
];

export default function CardDialog({
  isOpen,
  onClose,
  onSave,
  card = null,
  gamePlayers = [], // Active players (lineup + bench)
  cards = [], // All cards in the game (for validation)
  matchDuration = 90,
  isReadOnly = false,
  game = null // For feature flags if needed
}) {
  const [cardData, setCardData] = useState({
    playerId: null,
    cardType: 'yellow',
    minute: null,
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Get player's existing cards (excluding the card being edited)
  const getPlayerCards = (playerId) => {
    if (!playerId) return [];
    const filtered = cards.filter(c => {
      const cardPlayerId = c.playerId?._id || c.playerId;
      const currentCardId = card?._id;
      const matches = cardPlayerId === playerId && c._id !== currentCardId;
      return matches;
    });
    
    // 🔍 DEBUG LOG
    console.log('🔍 [CardDialog] getPlayerCards:', {
      playerId,
      totalCards: cards.length,
      currentCardId: card?._id,
      filteredCards: filtered.length,
      filteredCardTypes: filtered.map(c => c.cardType),
      isEditing: !!card
    });
    
    return filtered;
  };

  // Get available card options for selected player
  // When editing, don't show validation warnings (backend will validate)
  const playerCardsForValidation = cardData.playerId ? getPlayerCards(cardData.playerId) : [];
  const availableOptions = cardData.playerId && !card
    ? getAvailableCardOptions(playerCardsForValidation)
    : { yellow: true, red: true, secondYellow: false, isSentOff: false };
  
  // 🔍 DEBUG LOG
  useEffect(() => {
    if (cardData.playerId) {
      console.log('🔍 [CardDialog] Available Options:', {
        playerId: cardData.playerId,
        isEditing: !!card,
        currentCardId: card?._id,
        currentCardType: card?.cardType,
        selectedCardType: cardData.cardType,
        availableOptions,
        playerCardsCount: playerCardsForValidation.length,
        playerCardsTypes: playerCardsForValidation.map(c => c.cardType)
      });
    }
  }, [cardData.playerId, cardData.cardType, card, availableOptions]);

  // Initialize form data when dialog opens or card changes
  useEffect(() => {
    console.log('🔍 [CardDialog] useEffect [isOpen, card]:', {
      isOpen,
      card: card ? {
        _id: card._id,
        cardType: card.cardType,
        playerId: card.playerId?._id || card.playerId,
        minute: card.minute
      } : null,
      cardType: typeof card,
      cardIsObject: card !== null && typeof card === 'object',
      cardsLength: cards.length
    });
    
    if (isOpen) {
      console.log('🔍 [CardDialog] Dialog opened:', {
        isEditing: !!card,
        cardId: card?._id,
        cardType: card?.cardType,
        cardPlayerId: card?.playerId?._id || card?.playerId,
        totalCardsInProps: cards.length,
        cardPropValue: card,
        cardPropIsNull: card === null,
        cardPropIsUndefined: card === undefined
      });
      
      if (card) {
        // Editing existing card
        setCardData({
          playerId: card.playerId?._id || card.playerId || null,
          cardType: card.cardType || 'yellow',
          minute: card.minute || null,
          reason: card.reason || ''
        });
      } else {
        // Creating new card
        setCardData({
          playerId: null,
          cardType: 'yellow',
          minute: null,
          reason: ''
        });
      }
      setErrors({});
      setValidationError(null);
    }
  }, [isOpen, card, cards.length]);

  // Auto-select recommended card type when player is selected
  useEffect(() => {
    if (isOpen && !card && cardData.playerId) {
      const playerCards = getPlayerCards(cardData.playerId);
      const recommended = getRecommendedCardType(playerCards);
      
      if (recommended && availableOptions[recommended.replace('-', '')]) {
        setCardData(prev => ({ ...prev, cardType: recommended }));
      }
    }
  }, [cardData.playerId, isOpen, card]);

  // Validate card selection when player or card type changes
  useEffect(() => {
    if (cardData.playerId && cardData.cardType && !card) {
      const playerCards = getPlayerCards(cardData.playerId);
      const validation = canReceiveCard(playerCards, cardData.cardType);
      
      if (!validation.valid) {
        setValidationError(validation.error);
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [cardData.playerId, cardData.cardType, card]);

  const validateForm = () => {
    const newErrors = {};

    if (!cardData.playerId) {
      newErrors.playerId = 'Player is required';
    }

    if (!cardData.cardType) {
      newErrors.cardType = 'Card type is required';
    }

    // Card validation logic (only for new cards, not edits)
    if (!card && cardData.playerId && cardData.cardType) {
      const playerCards = getPlayerCards(cardData.playerId);
      const validation = canReceiveCard(playerCards, cardData.cardType);
      
      if (!validation.valid) {
        newErrors.cardType = validation.error;
      }
    }

    if (!cardData.minute || cardData.minute < 1) {
      newErrors.minute = 'Minute is required';
    } else if (cardData.minute > matchDuration) {
      newErrors.minute = `Minute cannot exceed match duration (${matchDuration} minutes)`;
    }

    if (cardData.reason && cardData.reason.length > 200) {
      newErrors.reason = 'Reason cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        playerId: cardData.playerId,
        cardType: cardData.cardType,
        minute: cardData.minute,
        reason: cardData.reason || ''
      });
      onClose();
    } catch (error) {
      // Extract detailed error message from backend
      const errorMessage = error.message || 'Failed to save card';
      setErrors({ submit: errorMessage });
      // Log to console for debugging (less verbose)
      console.warn('Card validation failed:', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare dialog configuration
  const title = isReadOnly ? 'View Card' : card ? 'Edit Card' : 'Add Card';
  const description = isReadOnly
    ? 'View card details'
    : card
    ? 'Update card information'
    : 'Record a disciplinary card (Yellow, Red, or Second Yellow)';
  
  const isConfirmDisabled = isSaving || 
    (availableOptions.isSentOff && !card) || 
    (!!validationError && !card);

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      titleIcon={<ShieldAlert className="text-yellow-400" />}
      description={description}
      size="lg"
      isLoading={isSaving}
      isReadOnly={isReadOnly}
      error={errors.submit}
      errors={errors}
      actions={
        isReadOnly
          ? { cancel: { label: 'Close', onClick: onClose } }
          : {
              cancel: { label: 'Cancel', onClick: onClose, disabled: isSaving },
              confirm: {
                label: card ? 'Update Card' : 'Add Card',
                onClick: handleSave,
                disabled: isConfirmDisabled,
                loading: isSaving
              }
            }
      }
    >
      <div className="space-y-4">
          {/* Player */}
          <div className="space-y-2">
            <Label htmlFor="player" className="text-slate-300">Player *</Label>
            <Select
              value={cardData.playerId || ''}
              onValueChange={(value) => setCardData(prev => ({ ...prev, playerId: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select player..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {gamePlayers.map(player => (
                  <SelectItem key={player._id} value={player._id} className="text-white">
                    #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.playerId && <p className="text-red-400 text-sm">{errors.playerId}</p>}
          </div>

          {/* Card Type */}
          <div className="space-y-2">
            <Label className="text-slate-300">Card Type *</Label>
            
            {/* Warning if player is sent off */}
            {(() => {
              // 🔍 DEBUG LOG
              if (availableOptions.isSentOff) {
                console.log('🔍 [CardDialog] Rendering "Sent Off" warning:', {
                  isSentOff: availableOptions.isSentOff,
                  isEditing: !!card,
                  shouldShow: availableOptions.isSentOff && !card,
                  cardId: card?._id,
                  playerId: cardData.playerId
                });
              }
              return null;
            })()}
            {availableOptions.isSentOff && !card && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-semibold">Player Already Sent Off</p>
                  <p className="text-red-300 text-xs mt-1">
                    This player has already received a red card or second yellow and cannot receive additional cards.
                  </p>
                </div>
              </div>
            )}
            
            <RadioGroup
              value={cardData.cardType}
              onValueChange={(value) => setCardData(prev => ({ ...prev, cardType: value }))}
              disabled={isReadOnly || (availableOptions.isSentOff && !card)}
              className="flex gap-4"
            >
              {CARD_TYPES.map(type => {
                // Determine if this card type is available for the selected player
                let isDisabled = false;
                if (!card && cardData.playerId) {
                  if (type.value === 'yellow') {
                    isDisabled = !availableOptions.yellow;
                  } else if (type.value === 'red') {
                    isDisabled = !availableOptions.red;
                  } else if (type.value === 'second-yellow') {
                    isDisabled = !availableOptions.secondYellow;
                  }
                }
                return (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={type.value} 
                      id={type.value} 
                      disabled={isDisabled || isReadOnly || (availableOptions.isSentOff && !card)}
                      className="text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                    />
                    <Label 
                      htmlFor={type.value} 
                      className={`cursor-pointer ${
                        isDisabled || (availableOptions.isSentOff && !card)
                          ? 'text-slate-500 cursor-not-allowed opacity-50' 
                          : 'text-white'
                      }`}
                    >
                      <span className="mr-2">{type.emoji}</span>
                      {type.label}
                      {isDisabled && !availableOptions.isSentOff && (
                        <span className="ml-2 text-xs text-slate-500">(Not available)</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            {errors.cardType && <p className="text-red-400 text-sm">{errors.cardType}</p>}
            {validationError && !errors.cardType && !card && (
              <p className="text-yellow-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </p>
            )}
          </div>

          {/* Minute */}
          <div className="space-y-2">
            <Label htmlFor="minute" className="text-slate-300">Minute *</Label>
            <Input
              id="minute"
              type="number"
              min="1"
              max={matchDuration}
              value={cardData.minute || ''}
              onChange={(e) => setCardData(prev => ({ ...prev, minute: parseInt(e.target.value) || null }))}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={`1-${matchDuration}`}
            />
            <p className="text-xs text-slate-500">
              Critical: This minute is used for timeline ordering and minutes calculation
            </p>
            {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-slate-300">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={cardData.reason}
              onChange={(e) => setCardData(prev => ({ ...prev, reason: e.target.value }))}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="e.g., Unsporting behavior, Serious foul play..."
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              {cardData.reason.length}/200 characters
            </p>
            {errors.reason && <p className="text-red-400 text-sm">{errors.reason}</p>}
          </div>
        </div>
    </BaseDialog>
  );
}

