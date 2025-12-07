/**
 * Virtual List Component
 * Renders only visible items for optimal performance with large lists
 * 
 * Use Cases:
 * - Player lists (50+ players)
 * - Game schedules (100+ games)
 * - Drill libraries (200+ drills)
 * 
 * Benefits:
 * - Renders only ~10 visible items instead of all items
 * - Smooth scrolling even with 1000+ items
 * - 90% reduction in DOM nodes
 * - Lower memory usage
 * - Better mobile performance
 */

import { List as FixedSizeList } from 'react-window';

/**
 * Virtual List for fixed-height items
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item: (item, index) => JSX
 * @param {number} itemHeight - Height of each item in pixels
 * @param {number} height - Total height of the list container
 * @param {string} className - Optional CSS classes
 */
export function VirtualList({
  items = [],
  renderItem,
  itemHeight = 120,
  height = 600,
  className = '',
}) {
  // Render function for react-window
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <div style={style}>
        {renderItem(item, index)}
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
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className={className}
      overscanCount={3} // Render 3 extra items above/below for smooth scrolling
    >
      {Row}
    </FixedSizeList>
  );
}

export default VirtualList;

