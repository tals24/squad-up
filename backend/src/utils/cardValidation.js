/**
 * Card Validation Utility (Backend)
 * 
 * Validates if a player can receive a specific card type based on their existing cards.
 * Follows football rules:
 * - Clean Slate (0 cards): Can get Yellow OR Red, NOT Second Yellow
 * - Existing Yellow (1 Yellow): Can get Second Yellow OR Direct Red, NOT another Yellow
 * - Sent Off (Red OR Second Yellow): Cannot receive ANY new cards
 * 
 * @param {Array} existingCards - Array of existing card objects for the player
 * @param {string} newCardType - The card type being requested ('yellow', 'red', 'second-yellow')
 * @returns {{ valid: boolean, error: string|null }}
 */
function canReceiveCard(existingCards, newCardType) {
  // Filter to only cards for this player (in case array contains multiple players)
  const playerCards = existingCards || [];
  
  // Count card types
  const yellowCount = playerCards.filter(card => card.cardType === 'yellow').length;
  const hasRed = playerCards.some(card => card.cardType === 'red');
  const hasSecondYellow = playerCards.some(card => card.cardType === 'second-yellow');
  
  // Check if player is already sent off
  if (hasRed || hasSecondYellow) {
    return {
      valid: false,
      error: 'Player has already been sent off and cannot receive additional cards'
    };
  }
  
  // Validate based on new card type
  switch (newCardType) {
    case 'yellow':
      // Can only get Yellow if player has 0 cards
      if (yellowCount === 0) {
        return { valid: true, error: null };
      }
      return {
        valid: false,
        error: 'Player already has a yellow card. Use "Second Yellow" instead'
      };
      
    case 'second-yellow':
      // Can only get Second Yellow if player has exactly 1 Yellow
      if (yellowCount === 1) {
        return { valid: true, error: null };
      }
      if (yellowCount === 0) {
        return {
          valid: false,
          error: 'Player must have a yellow card before receiving a second yellow'
        };
      }
      return {
        valid: false,
        error: 'Player already has multiple yellow cards or has been sent off'
      };
      
    case 'red':
      // Can get Red at any time (unless already sent off, which we checked above)
      return { valid: true, error: null };
      
    default:
      return {
        valid: false,
        error: `Invalid card type: ${newCardType}`
      };
  }
}

module.exports = { canReceiveCard };

