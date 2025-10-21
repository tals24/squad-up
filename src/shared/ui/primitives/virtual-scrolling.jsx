/**
 * SquadUp Virtual Scrolling Components
 * 
 * High-performance virtual scrolling for large lists and tables
 * with smooth animations and accessibility support.
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/shared/lib/utils";
import { FixedSizeList as List, VariableSizeList, areEqual } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { createAriaProps } from "@/shared/lib/accessibility";

// ===========================================
// VIRTUAL LIST COMPONENT
// ===========================================

export interface VirtualListItem {
  id: string | number;
  data: any;
  height?: number;
}

export interface VirtualListProps {
  items: VirtualListItem[];
  itemHeight?: number | ((index: number) => number);
  height?: number;
  width?: string | number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  renderItem: (props: {
    item: VirtualListItem;
    index: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }) => React.ReactNode;
  onScroll?: (props: { scrollDirection: string; scrollOffset: number }) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  enableAnimation?: boolean;
  scrollToIndex?: number;
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start';
}

export const VirtualList = forwardRef<any, VirtualListProps>(({
  items,
  itemHeight = 60,
  height = 400,
  width = '100%',
  overscan = 5,
  className,
  itemClassName,
  renderItem,
  onScroll,
  loadingComponent,
  emptyComponent,
  enableAnimation = true,
  scrollToIndex,
  scrollToAlignment = 'auto',
}, ref) => {
  const listRef = useRef<any>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollTop = useRef(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (offset: number) => listRef.current?.scrollTo(offset),
    scrollToItem: (index: number, align?: string) => 
      listRef.current?.scrollToItem(index, align),
  }));

  // Scroll to specific index when prop changes
  useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, scrollToAlignment);
    }
  }, [scrollToIndex, scrollToAlignment]);

  const handleScroll = useCallback(({ scrollDirection: dir, scrollOffset }) => {
    const direction = scrollOffset > lastScrollTop.current ? 'down' : 'up';
    setScrollDirection(direction);
    lastScrollTop.current = scrollOffset;
    onScroll?.({ scrollDirection: dir, scrollOffset });
  }, [onScroll]);

  const handleItemsRendered = useCallback(() => {
    setIsScrolling(false);
  }, []);

  const MemoizedItem = React.memo(({ index, style, data, isScrolling: itemIsScrolling }) => {
    const item = data[index];
    const itemVariants = enableAnimation ? {
      hidden: { opacity: 0, y: scrollDirection === 'down' ? 20 : -20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
      },
    } : {};

    const content = renderItem({
      item,
      index,
      style: enableAnimation ? { ...style, overflow: 'hidden' } : style,
      isScrolling: itemIsScrolling,
    });

    if (!enableAnimation) {
      return (
        <div 
          style={style} 
          className={itemClassName}
          {...createAriaProps({
            role: 'listitem',
            label: `Item ${index + 1} of ${items.length}`
          })}
        >
          {content}
        </div>
      );
    }

    return (
      <motion.div
        style={style}
        className={itemClassName}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        layout
        {...createAriaProps({
          role: 'listitem',
          label: `Item ${index + 1} of ${items.length}`
        })}
      >
        {content}
      </motion.div>
    );
  }, areEqual);

  if (items.length === 0 && emptyComponent) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        {emptyComponent}
      </div>
    );
  }

  const getItemSize = typeof itemHeight === 'function' 
    ? itemHeight 
    : () => itemHeight as number;

  const ListComponent = typeof itemHeight === 'function' ? VariableSizeList : List;

  return (
    <div 
      className={cn('virtual-list-container', className)} 
      style={{ height, width }}
      {...createAriaProps({
        role: 'list',
        label: `Virtual list with ${items.length} items`
      })}
    >
      <ListComponent
        ref={listRef}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemSize}
        itemData={items}
        overscanCount={overscan}
        onScroll={handleScroll}
        onItemsRendered={handleItemsRendered}
        useIsScrolling
      >
        {MemoizedItem}
      </ListComponent>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

// ===========================================
// VIRTUAL GRID COMPONENT
// ===========================================

export interface VirtualGridItem {
  id: string | number;
  data: any;
}

export interface VirtualGridProps {
  items: VirtualGridItem[];
  columnCount: number;
  rowCount?: number;
  columnWidth: number;
  rowHeight: number;
  height?: number;
  width?: string | number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  renderItem: (props: {
    item: VirtualGridItem;
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }) => React.ReactNode;
  onScroll?: (props: { scrollDirection: string; scrollLeft: number; scrollTop: number }) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  enableAnimation?: boolean;
}

export const VirtualGrid: React.FC<VirtualGridProps> = ({
  items,
  columnCount,
  rowCount,
  columnWidth,
  rowHeight,
  height = 400,
  width = '100%',
  overscan = 5,
  className,
  itemClassName,
  renderItem,
  onScroll,
  loadingComponent,
  emptyComponent,
  enableAnimation = true,
}) => {
  const gridRef = useRef<any>(null);
  const calculatedRowCount = rowCount || Math.ceil(items.length / columnCount);

  const MemoizedGridItem = React.memo(({ 
    columnIndex, 
    rowIndex, 
    style, 
    data, 
    isScrolling: itemIsScrolling 
  }) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    const item = data[itemIndex];
    
    if (!item) return null;

    const itemVariants = enableAnimation ? {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          duration: 0.3, 
          delay: (columnIndex + rowIndex) * 0.05,
          ease: [0.25, 0.46, 0.45, 0.94] 
        }
      },
    } : {};

    const content = renderItem({
      item,
      columnIndex,
      rowIndex,
      style: enableAnimation ? { ...style, overflow: 'hidden' } : style,
      isScrolling: itemIsScrolling,
    });

    if (!enableAnimation) {
      return (
        <div 
          style={style} 
          className={itemClassName}
          {...createAriaProps({
            role: 'gridcell',
            label: `Item ${itemIndex + 1} at row ${rowIndex + 1}, column ${columnIndex + 1}`
          })}
        >
          {content}
        </div>
      );
    }

    return (
      <motion.div
        style={style}
        className={itemClassName}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        layout
        {...createAriaProps({
          role: 'gridcell',
          label: `Item ${itemIndex + 1} at row ${rowIndex + 1}, column ${columnIndex + 1}`
        })}
      >
        {content}
      </motion.div>
    );
  }, areEqual);

  if (items.length === 0 && emptyComponent) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        {emptyComponent}
      </div>
    );
  }

  return (
    <div 
      className={cn('virtual-grid-container', className)} 
      style={{ height, width }}
      {...createAriaProps({
        role: 'grid',
        label: `Virtual grid with ${items.length} items in ${calculatedRowCount} rows and ${columnCount} columns`
      })}
    >
      <Grid
        ref={gridRef}
        height={height}
        width={width}
        columnCount={columnCount}
        rowCount={calculatedRowCount}
        columnWidth={columnWidth}
        rowHeight={rowHeight}
        itemData={items}
        overscanRowCount={overscan}
        overscanColumnCount={overscan}
        onScroll={onScroll}
        useIsScrolling
      >
        {MemoizedGridItem}
      </Grid>
    </div>
  );
};

// ===========================================
// AUTO-SIZED VIRTUAL LIST
// ===========================================

export interface AutoSizedVirtualListProps extends Omit<VirtualListProps, 'height' | 'width'> {
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export const AutoSizedVirtualList: React.FC<AutoSizedVirtualListProps> = ({
  minHeight = 200,
  maxHeight = 600,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('w-full', className)} 
      style={{ minHeight, maxHeight }}
    >
      <AutoSizer>
        {({ height, width }) => (
          <VirtualList
            {...props}
            height={Math.min(Math.max(height, minHeight), maxHeight)}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
};

// ===========================================
// INFINITE SCROLL VIRTUAL LIST
// ===========================================

export interface InfiniteVirtualListProps extends VirtualListProps {
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  loadMore?: () => Promise<void>;
  threshold?: number;
  loadingMoreComponent?: React.ReactNode;
}

export const InfiniteVirtualList: React.FC<InfiniteVirtualListProps> = ({
  hasNextPage = false,
  isLoadingMore = false,
  loadMore,
  threshold = 5,
  loadingMoreComponent,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleItemsRendered = useCallback(({ 
    visibleStartIndex, 
    visibleStopIndex 
  }) => {
    const shouldLoadMore = 
      hasNextPage && 
      !isLoading && 
      !isLoadingMore &&
      loadMore &&
      (props.items.length - visibleStopIndex) <= threshold;

    if (shouldLoadMore) {
      setIsLoading(true);
      loadMore().finally(() => setIsLoading(false));
    }
  }, [hasNextPage, isLoading, isLoadingMore, loadMore, threshold, props.items.length]);

  const itemsWithLoader = useMemo(() => {
    const items = [...props.items];
    if (hasNextPage || isLoadingMore || isLoading) {
      items.push({
        id: 'loader',
        data: { isLoader: true },
      });
    }
    return items;
  }, [props.items, hasNextPage, isLoadingMore, isLoading]);

  const renderItemWithLoader = useCallback((itemProps) => {
    if (itemProps.item.data?.isLoader) {
      return (
        <div className="flex items-center justify-center p-4">
          {loadingMoreComponent || (
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-2 h-2 bg-primary-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-primary-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-primary-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
              <span className="ml-2 text-sm text-neutral-600">Loading more...</span>
            </div>
          )}
        </div>
      );
    }
    return props.renderItem(itemProps);
  }, [props.renderItem, loadingMoreComponent]);

  return (
    <VirtualList
      {...props}
      items={itemsWithLoader}
      renderItem={renderItemWithLoader}
      onItemsRendered={handleItemsRendered}
    />
  );
};

// ===========================================
// VIRTUAL TABLE COMPONENT
// ===========================================

export interface VirtualTableColumn {
  key: string;
  title: string;
  width: number;
  render?: (value: any, item: any, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualTableProps {
  data: any[];
  columns: VirtualTableColumn[];
  rowHeight?: number;
  headerHeight?: number;
  height?: number;
  width?: string | number;
  className?: string;
  rowClassName?: string | ((item: any, index: number) => string);
  onRowClick?: (item: any, index: number) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  enableAnimation?: boolean;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  columns,
  rowHeight = 48,
  headerHeight = 40,
  height = 400,
  width = '100%',
  className,
  rowClassName,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  enableAnimation = true,
}) => {
  const tableRef = useRef<any>(null);

  const renderRow = useCallback(({ item, index, style, isScrolling }) => {
    const rowClasses = typeof rowClassName === 'function' 
      ? rowClassName(item, index) 
      : rowClassName;

    return (
      <motion.div
        style={style}
        className={cn(
          'flex border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer',
          rowClasses
        )}
        onClick={() => onRowClick?.(item, index)}
        initial={enableAnimation ? { opacity: 0, x: -10 } : false}
        animate={enableAnimation ? { opacity: 1, x: 0 } : false}
        transition={enableAnimation ? { duration: 0.2, delay: index * 0.02 } : false}
        {...createAriaProps({
          role: 'row',
          label: `Table row ${index + 1}`
        })}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex items-center px-4 py-2 flex-shrink-0',
              column.align === 'center' && 'justify-center',
              column.align === 'right' && 'justify-end'
            )}
            style={{ width: column.width }}
            {...createAriaProps({
              role: 'cell',
              label: `${column.title}: ${column.render ? 'custom content' : item[column.key]}`
            })}
          >
            {column.render ? column.render(item[column.key], item, index) : item[column.key]}
          </div>
        ))}
      </motion.div>
    );
  }, [columns, rowClassName, onRowClick, enableAnimation]);

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  return (
    <div className={cn('virtual-table', className)} style={{ height, width }}>
      {/* Header */}
      <div 
        className="flex bg-neutral-100 border-b border-neutral-200 font-medium text-sm"
        style={{ height: headerHeight }}
        {...createAriaProps({
          role: 'rowgroup',
          label: 'Table header'
        })}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex items-center px-4 py-2 flex-shrink-0',
              column.sortable && 'cursor-pointer hover:bg-neutral-200',
              column.align === 'center' && 'justify-center',
              column.align === 'right' && 'justify-end'
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.key)}
            {...createAriaProps({
              role: 'columnheader',
              label: column.title,
              ...(column.sortable && {
                describedBy: `Sort by ${column.title}`,
                role: 'button'
              })
            })}
          >
            {column.title}
            {column.sortable && sortBy === column.key && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-1"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </motion.span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <VirtualList
        items={data.map((item, index) => ({ id: index, data: item }))}
        itemHeight={rowHeight}
        height={height - headerHeight}
        renderItem={({ item }) => renderRow({ 
          item: item.data, 
          index: item.id, 
          style: { height: rowHeight }, 
          isScrolling: false 
        })}
        enableAnimation={enableAnimation}
      />
    </div>
  );
};

export default {
  VirtualList,
  VirtualGrid,
  AutoSizedVirtualList,
  InfiniteVirtualList,
  VirtualTable,
};
