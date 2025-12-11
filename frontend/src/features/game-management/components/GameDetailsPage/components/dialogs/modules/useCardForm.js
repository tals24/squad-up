import { useState, useEffect } from 'react';

import {
  canReceiveCard,
  getAvailableCardOptions,
  getRecommendedCardType
} from '../../../../../utils/cardValidation';

/**
 * Custom hook for card form state and validation
 */
export function useCardForm(card, cards, gamePlayers, matchDuration, isOpen) {
  const [cardData, setCardData] = useState({
    playerId: null,
    cardType: 'yellow',
    minute: null,
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [validationError, setValidationError] = useState(null);

  // Get player's existing cards (excluding the card being edited)
  const getPlayerCards = (playerId) => {
    if (!playerId) return [];
    return cards.filter(c => {
      const cardPlayerId = c.playerId?._id || c.playerId;
      const currentCardId = card?._id;
      return cardPlayerId === playerId && c._id !== currentCardId;
    });
  };

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (card) {
        setCardData({
          playerId: card.playerId?._id || card.playerId || null,
          cardType: card.cardType || 'yellow',
          minute: card.minute || null,
          reason: card.reason || ''
        });
      } else {
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
  }, [isOpen, card]);

  // Auto-select recommended card type
  useEffect(() => {
    if (isOpen && !card && cardData.playerId) {
      const playerCards = getPlayerCards(cardData.playerId);
      const recommended = getRecommendedCardType(playerCards);
      const availableOptions = getAvailableCardOptions(playerCards);
      
      if (recommended && availableOptions[recommended.replace('-', '')]) {
        setCardData(prev => ({ ...prev, cardType: recommended }));
      }
    }
  }, [cardData.playerId, isOpen, card]);

  // Validate card selection
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!cardData.playerId) {
      newErrors.playerId = 'Player is required';
    }

    if (!cardData.cardType) {
      newErrors.cardType = 'Card type is required';
    }

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

  // Get available card options for UI
  const getAvailableOptions = () => {
    const playerCards = cardData.playerId ? getPlayerCards(cardData.playerId) : [];
    return card ? { yellow: true, red: true, secondYellow: false, isSentOff: false } 
                : getAvailableCardOptions(playerCards);
  };

  return {
    cardData,
    setCardData,
    errors,
    setErrors,
    validationError,
    validateForm,
    getAvailableOptions,
    getPlayerCards,
  };
}

