import { fetchCards, createCard, updateCard, deleteCard } from '../../../api/cardsApi';
import { fetchMatchTimeline } from '../../../api/timelineApi';

/**
 * useCardsHandlers
 * 
 * Manages all card-related CRUD operations:
 * - Add new card (yellow/red)
 * - Edit existing card
 * - Delete card
 * - Update timeline and stats
 * 
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Array} params.cards - Current cards array
 * @param {Function} params.setCards - Set cards state
 * @param {Function} params.setTimeline - Set timeline state
 * @param {Object} params.selectedCard - Currently selected card
 * @param {Function} params.setSelectedCard - Set selected card
 * @param {Function} params.setShowCardDialog - Show/hide dialog
 * @param {Function} params.refreshTeamStats - Refresh team stats after changes
 * 
 * @returns {Object} Card handlers
 */
export function useCardsHandlers({
  gameId,
  cards,
  setCards,
  setTimeline,
  selectedCard,
  setSelectedCard,
  setShowCardDialog,
  refreshTeamStats,
}) {
  
  /**
   * Open dialog to add new card
   */
  const handleAddCard = () => {
    setSelectedCard(null);
    setShowCardDialog(true);
  };

  /**
   * Open dialog to edit existing card
   */
  const handleEditCard = (card) => {
    console.log('🔍 [useCardsHandlers] handleEditCard called:', {
      card: card ? {
        _id: card._id,
        cardType: card.cardType,
        playerId: card.playerId?._id || card.playerId,
        minute: card.minute
      } : null,
      cardsArrayLength: cards.length,
    });
    setSelectedCard(card);
    setShowCardDialog(true);
  };

  /**
   * Delete a card (with confirmation)
   */
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await deleteCard(gameId, cardId);
      setCards(prevCards => prevCards.filter(c => c._id !== cardId));
      // Refresh team stats if red card was deleted (affects minutes)
      refreshTeamStats();
    } catch (error) {
      console.error('[useCardsHandlers] Error deleting card:', error);
      alert('Failed to delete card: ' + error.message);
    }
  };

  /**
   * Save card (create or update)
   */
  const handleSaveCard = async (cardData) => {
    try {
      console.log('🔍 [useCardsHandlers] handleSaveCard called:', {
        isEditing: !!selectedCard,
        selectedCardId: selectedCard?._id,
        cardData
      });
      
      const wasEditing = !!selectedCard;
      const editingCardId = selectedCard?._id;
      const cardToUpdate = selectedCard; // Save reference before clearing
      
      if (cardToUpdate) {
        // Update existing card
        const updatedCard = await updateCard(gameId, cardToUpdate._id, cardData);
        console.log('🔍 [useCardsHandlers] Card updated:', {
          oldCardId: cardToUpdate._id,
          updatedCardId: updatedCard._id,
          updatedCard
        });
        setCards(prevCards => prevCards.map(c => c._id === updatedCard._id ? updatedCard : c));
      } else {
        // Create new card
        const newCard = await createCard(gameId, cardData);
        setCards(prevCards => [...prevCards, newCard]);
      }
      
      // Close dialog AFTER successful save to prevent re-render issues during card refresh
      setShowCardDialog(false);
      setSelectedCard(null);
      
      // Refresh cards list (after dialog is closed)
      const updatedCards = await fetchCards(gameId);
      console.log('🔍 [useCardsHandlers] Cards refreshed:', {
        updatedCardsCount: updatedCards.length,
        wasEditing,
        editingCardId,
        updatedCardExists: wasEditing ? updatedCards.find(c => c._id === editingCardId) ? 'YES' : 'NO' : 'N/A'
      });
      setCards(updatedCards);
      
      // Refresh team stats after card save (affects red card minutes)
      refreshTeamStats();
      
      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('[useCardsHandlers] Error refreshing timeline:', error);
      }
    } catch (error) {
      console.error('[useCardsHandlers] Error saving card:', error);
      throw error; // Re-throw to let CardDialog handle it
    }
  };

  return {
    handleAddCard,
    handleEditCard,
    handleDeleteCard,
    handleSaveCard,
  };
}

