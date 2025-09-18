/**
 * SquadUp Phase 4 Demo Component
 * 
 * Comprehensive showcase of all Phase 4 enhancements:
 * - Advanced animations with shared element transitions
 * - Virtual scrolling and performance optimizations
 * - Progressive loading and lazy components
 * - Advanced theming capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Layers, 
  Rocket, 
  Palette, 
  Play, 
  Pause, 
  RefreshCw,
  Eye,
  Database,
  Clock,
  Cpu,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Container,
  Section,
  Heading,
  Text,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/design-system-components';

import {
  SharedElement,
  AdvancedCard,
  AnimatedSVGIcon,
  ChoreographedList,
  ScrollReveal,
  AdvancedSpinner,
  AnimationPerformanceIndicator,
} from '@/components/ui/advanced-animated-components';

import {
  VirtualList,
  VirtualGrid,
  AutoSizedVirtualList,
  InfiniteVirtualList,
} from '@/components/ui/virtual-scrolling';

import {
  LazyLoad,
  ProgressiveImage,
  ProgressiveEnhancement,
  createLazyComponent,
  OptimizedSuspense,
} from '@/lib/progressive-loading';

import { ThemeManager } from '@/lib/advanced-theming';
import ThemeEditor from './ThemeEditor';

// ===========================================
// DEMO DATA GENERATORS
// ===========================================

const generateDemoItems = (count) => 
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Demo Item ${i + 1}`,
    subtitle: `Subtitle for item ${i + 1}`,
    description: `This is a longer description for demo item ${i + 1} to show how content flows.`,
    value: Math.floor(Math.random() * 100),
    category: ['Performance', 'Animation', 'Theme', 'UX'][i % 4],
    color: ['primary', 'secondary', 'success', 'warning'][i % 4],
  }));

const demoItems = generateDemoItems(1000);

// ===========================================
// LAZY LOADED COMPONENTS
// ===========================================

const LazyAdvancedChart = createLazyComponent(
  () => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: ({ data }) => (
          <div className="h-64 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <Text variant="lg" className="font-semibold">Advanced Chart</Text>
              <Text variant="sm" className="text-neutral-600">
                {data?.length || 0} data points loaded
              </Text>
            </div>
          </div>
        )
      });
    }, 1000);
  }),
  { delay: 500 }
);

const LazyComplexWidget = createLazyComponent(
  () => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: ({ title, data }) => (
          <AdvancedCard className="p-6">
            <Heading level={4} className="mb-4">{title}</Heading>
            <div className="space-y-2">
              {data.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                  <Text variant="sm">{item.title}</Text>
                  <Badge variant="secondary">{item.value}%</Badge>
                </div>
              ))}
            </div>
          </AdvancedCard>
        )
      });
    }, 800);
  }),
  { delay: 300 }
);

// ===========================================
// DEMO SECTIONS
// ===========================================

const AnimationDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const demoCards = [
    { id: 1, title: 'Shared Transitions', icon: Layers, color: 'from-blue-500 to-cyan-500' },
    { id: 2, title: 'SVG Animations', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
    { id: 3, title: 'Motion Choreography', icon: Zap, color: 'from-green-500 to-emerald-500' },
    { id: 4, title: 'Performance Optimized', icon: Rocket, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={3}>Advanced Animation System</Heading>
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant={isPlaying ? "secondary" : "primary"}
        >
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? 'Pause' : 'Play'} Demo
        </Button>
      </div>

      <ChoreographedList layout="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {demoCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <SharedElement
              key={card.id}
              layoutId={`demo-card-${card.id}`}
              onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
            >
              <AdvancedCard
                interactive
                className="cursor-pointer overflow-hidden"
                animationDelay={index * 0.1}
              >
                <div className={`bg-gradient-to-r ${card.color} p-6 text-white`}>
                  <AnimatedSVGIcon
                    animationType="scale"
                    duration={1}
                    trigger={isPlaying ? "immediate" : "hover"}
                    className="mb-3"
                  >
                    <Icon className="w-8 h-8" />
                  </AnimatedSVGIcon>
                  <Heading level={4} className="text-white mb-2">
                    {card.title}
                  </Heading>
                  <Text variant="sm" className="text-white/80">
                    Click to expand details
                  </Text>
                </div>
                
                <AnimatePresence>
                  {selectedCard === card.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-white"
                    >
                      <Text variant="sm" className="text-neutral-600">
                        Detailed information about {card.title.toLowerCase()} 
                        with performance metrics and implementation details.
                      </Text>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AdvancedCard>
            </SharedElement>
          );
        })}
      </ChoreographedList>
    </div>
  );
};

const VirtualScrollingDemo = () => {
  const [viewMode, setViewMode] = useState('list');
  const [itemCount, setItemCount] = useState(100);

  const renderListItem = ({ item, index, style }) => (
    <motion.div
      style={style}
      className="flex items-center p-4 border-b border-neutral-200 hover:bg-neutral-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.01 }}
    >
      <div className={`w-3 h-3 rounded-full mr-4 bg-${item.data.color}-500`} />
      <div className="flex-1">
        <Text variant="sm" className="font-medium">{item.data.title}</Text>
        <Text variant="xs" className="text-neutral-500">{item.data.subtitle}</Text>
      </div>
      <Badge variant="outline">{item.data.value}%</Badge>
    </motion.div>
  );

  const renderGridItem = ({ item, index, style }) => (
    <div style={style} className="p-2">
      <AdvancedCard size="sm" className="h-full">
        <div className="p-4 text-center">
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 bg-${item.data.color}-500`} />
          <Text variant="xs" className="font-medium truncate">{item.data.title}</Text>
          <Text variant="xs" className="text-neutral-500">{item.data.value}%</Text>
        </div>
      </AdvancedCard>
    </div>
  );

  const virtualItems = demoItems.slice(0, itemCount).map((item, index) => ({
    id: index,
    data: item,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={3}>Virtual Scrolling Performance</Heading>
        <div className="flex items-center gap-4">
          <Select value={itemCount.toString()} onValueChange={(value) => setItemCount(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 items</SelectItem>
              <SelectItem value="500">500 items</SelectItem>
              <SelectItem value="1000">1000 items</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-96 border border-neutral-200 rounded-lg overflow-hidden bg-white">
        {viewMode === 'list' ? (
          <VirtualList
            items={virtualItems}
            itemHeight={60}
            renderItem={renderListItem}
            enableAnimation
          />
        ) : (
          <VirtualGrid
            items={virtualItems}
            columnCount={4}
            columnWidth={150}
            rowHeight={120}
            renderItem={renderGridItem}
            enableAnimation
          />
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4 text-sm text-neutral-600">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>Rendering {itemCount} items efficiently</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Only visible items in DOM</span>
        </div>
      </div>
    </div>
  );
};

const ProgressiveLoadingDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const triggerReload = () => {
    setIsLoading(true);
    setShowAdvanced(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowAdvanced(true);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={3}>Progressive Loading & Lazy Components</Heading>
        <Button onClick={triggerReload} disabled={isLoading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Reload Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progressive Images */}
        <AdvancedCard>
          <CardHeader>
            <CardTitle>Progressive Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <LazyLoad
                key={i}
                fallback={
                  <div className="h-20 bg-neutral-200 rounded animate-pulse" />
                }
                threshold={0.1}
              >
                <ProgressiveImage
                  src={`https://picsum.photos/300/80?random=${i}`}
                  alt={`Demo image ${i}`}
                  className="h-20 w-full rounded"
                  placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMzAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo="
                />
              </LazyLoad>
            ))}
          </CardContent>
        </AdvancedCard>

        {/* Lazy Components */}
        <AdvancedCard>
          <CardHeader>
            <CardTitle>Lazy Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressiveEnhancement
              condition={showAdvanced}
              fallback={
                <div className="h-32 bg-neutral-100 rounded flex items-center justify-center">
                  <div className="text-center">
                    <AdvancedSpinner variant="dots" className="mb-2" />
                    <Text variant="sm" className="text-neutral-600">
                      Loading advanced features...
                    </Text>
                  </div>
                </div>
              }
            >
              <OptimizedSuspense
                fallback={<AdvancedSpinner variant="pulse" />}
                delay={200}
              >
                <LazyComplexWidget
                  title="Advanced Widget"
                  data={demoItems.slice(0, 5)}
                />
              </OptimizedSuspense>
            </ProgressiveEnhancement>
          </CardContent>
        </AdvancedCard>
      </div>

      {/* Large Lazy Chart */}
      <AdvancedCard>
        <CardHeader>
          <CardTitle>Lazy Loaded Chart Component</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyLoad
            fallback={
              <div className="h-64 bg-neutral-100 rounded flex items-center justify-center">
                <div className="text-center">
                  <AdvancedSpinner variant="bars" className="mb-4" />
                  <Text className="text-neutral-600">Loading chart component...</Text>
                </div>
              </div>
            }
          >
            <OptimizedSuspense>
              <LazyAdvancedChart data={demoItems} />
            </OptimizedSuspense>
          </LazyLoad>
        </CardContent>
      </AdvancedCard>
    </div>
  );
};

const ThemingDemo = () => {
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [themeManager] = useState(() => ThemeManager.getInstance());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={3}>Advanced Theming System</Heading>
        <Button 
          onClick={() => setShowThemeEditor(!showThemeEditor)}
          variant={showThemeEditor ? "secondary" : "primary"}
        >
          <Palette className="w-4 h-4 mr-2" />
          {showThemeEditor ? 'Hide' : 'Show'} Theme Editor
        </Button>
      </div>

      <AnimatePresence>
        {showThemeEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ThemeEditor />
          </motion.div>
        )}
      </AnimatePresence>

      {!showThemeEditor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Default Theme', 'Dark Theme', 'Custom Theme'].map((theme, index) => (
            <AdvancedCard key={theme} interactive animationDelay={index * 0.1}>
              <div className="p-6 text-center">
                <div className="flex justify-center space-x-1 mb-4">
                  {['#0ea5e9', '#2dd4bf', '#22c55e', '#f59e0b', '#ef4444'].map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Heading level={4} className="mb-2">{theme}</Heading>
                <Text variant="sm" className="text-neutral-600 mb-4">
                  {index === 0 ? 'Professional blue theme' : 
                   index === 1 ? 'Dark mode optimized' : 
                   'User-customized colors'}
                </Text>
                <Button size="sm" variant="outline" className="w-full">
                  Apply Theme
                </Button>
              </div>
            </AdvancedCard>
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// MAIN DEMO COMPONENT
// ===========================================

export default function Phase4Demo() {
  const [activeSection, setActiveSection] = useState('animations');

  const sections = [
    { id: 'animations', title: 'Advanced Animations', icon: Zap, component: AnimationDemo },
    { id: 'performance', title: 'Virtual Scrolling', icon: Rocket, component: VirtualScrollingDemo },
    { id: 'loading', title: 'Progressive Loading', icon: RefreshCw, component: ProgressiveLoadingDemo },
    { id: 'theming', title: 'Advanced Theming', icon: Palette, component: ThemingDemo },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || AnimationDemo;

  return (
    <Container size="xl" className="py-8">
      <Section>
        <div className="space-y-8">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-secondary-500 to-success-500 rounded-3xl mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <Heading level={1} className="mb-4">Phase 4: Advanced Features</Heading>
              <Text variant="large" className="text-neutral-600 max-w-3xl mx-auto">
                Experience the next level of web application performance and user experience 
                with advanced animations, virtual scrolling, progressive loading, and dynamic theming.
              </Text>
            </div>
          </ScrollReveal>

          {/* Navigation */}
          <ScrollReveal delay={0.1}>
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSection(section.id)}
                      className="relative px-4 py-2"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {section.title}
                    </Button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal delay={0.2}>
            <AdvancedCard className="min-h-[600px] overflow-hidden">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ActiveComponent />
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </AdvancedCard>
          </ScrollReveal>

          {/* Performance Indicator */}
          <AnimationPerformanceIndicator />
        </div>
      </Section>
    </Container>
  );
}
