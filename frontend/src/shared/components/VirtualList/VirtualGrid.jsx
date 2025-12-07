/**
 * Virtual Grid Component
 * Renders only visible items in a grid layout for optimal performance
 * 
 * Perfect for:
 * - Player grids with cards
 * - Drill library with thumbnails
 * - Team rosters
 */

import { Grid as FixedSizeGrid } from 'react-window';

/**
 * Virtual Grid for fixed-size items in grid layout
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item
 * @param {number} columnCount - Number of columns
 * @param {number} rowHeight - Height of each row
 * @param {number} columnWidth - Width of each column
 * @param {number} height - Total height of the grid
 * @param {string} className - Optional CSS classes
 */
export function VirtualGrid({
  items = [],
  renderItem,
  columnCount = 3,
  rowHeight = 200,
  columnWidth = 300,
  height = 600,
  className = '',
}) {
  // Calculate row count
  const rowCount = Math.ceil(items.length / columnCount);

  // Render function for react-window
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    
    // Don't render if beyond items array
    if (itemIndex >= items.length) {
      return null;
    }

    const item = items[itemIndex];
    
    return (
      <div style={style}>
        {renderItem(item, itemIndex)}
      </div>
    );
  };

  // Show empty state if no items
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <FixedSizeGrid
      height={height}
      columnCount={columnCount}
      columnWidth={columnWidth}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width="100%"
      className={className}
      overscanRowCount={2}
      overscanColumnCount={1}
    >
      {Cell}
    </FixedSizeGrid>
  );
}

export default VirtualGrid;

