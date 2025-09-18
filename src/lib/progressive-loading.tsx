/**
 * SquadUp Progressive Loading System
 * 
 * Lazy loading, progressive enhancement, and performance optimization
 * utilities for Phase 4 enhancements.
 */

import React, { 
  Suspense, 
  lazy, 
  useState, 
  useEffect, 
  useRef, 
  useMemo,
  ComponentType,
  LazyExoticComponent
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInView } from 'framer-motion';

// ===========================================
// LAZY LOADING UTILITIES
// ===========================================

export interface LazyComponentOptions {
  fallback?: React.ComponentType;
  delay?: number;
  retryCount?: number;
  preload?: boolean;
}

export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> => {
  const { fallback, delay = 0, retryCount = 3, preload = false } = options;

  let retries = 0;
  const retryableImportFn = async (): Promise<{ default: T }> => {
    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return await importFn();
    } catch (error) {
      if (retries < retryCount) {
        retries++;
        console.warn(`Lazy component load failed, retrying (${retries}/${retryCount})`);
        return retryableImportFn();
      }
      throw error;
    }
  };

  const LazyComponent = lazy(retryableImportFn);

  // Preload if requested
  if (preload) {
    retryableImportFn().catch(console.error);
  }

  return LazyComponent;
};

// ===========================================
// PROGRESSIVE IMAGE LOADING
// ===========================================

export interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  blurDataURL,
  className,
  sizes,
  quality = 75,
  priority = false,
  onLoad,
  onError,
  fallback,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || blurDataURL);
  const imgRef = useRef<HTMLImageElement>(null);
  const isInView = useInView(imgRef, { once: true, margin: "50px" });

  // Progressive enhancement - load high quality image when in view
  useEffect(() => {
    if (isInView || priority) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setIsError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [isInView, priority, src, onLoad, onError]);

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          !isLoaded && 'blur-sm scale-105',
          isLoaded && 'blur-0 scale-100'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => !isLoaded && setIsLoaded(true)}
        onError={() => setIsError(true)}
      />
      
      {!isLoaded && !isError && (
        <motion.div
          className="absolute inset-0 bg-neutral-200 animate-pulse"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
};

// ===========================================
// LAZY LOADING WRAPPER
// ===========================================

export interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  className?: string;
  animationDelay?: number;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  once = true,
  className,
  animationDelay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once, 
    margin: rootMargin,
    amount: threshold 
  });

  return (
    <div ref={ref} className={className}>
      <AnimatePresence mode="wait">
        {isInView ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.4, 
              delay: animationDelay,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
          >
            {children}
          </motion.div>
        ) : (
          fallback && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {fallback}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

// ===========================================
// PROGRESSIVE ENHANCEMENT WRAPPER
// ===========================================

export interface ProgressiveEnhancementProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  condition?: boolean;
  delay?: number;
  className?: string;
}

export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  children,
  fallback,
  condition = true,
  delay = 0,
  className,
}) => {
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    if (condition) {
      const timer = setTimeout(() => {
        setIsEnhanced(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [condition, delay]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isEnhanced ? (
          <motion.div
            key="enhanced"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===========================================
// RESOURCE LOADING UTILITIES
// ===========================================

export class ResourceLoader {
  private static cache = new Map<string, Promise<any>>();
  private static loadedResources = new Set<string>();

  static async loadScript(src: string): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve();
    }

    if (this.cache.has(src)) {
      return this.cache.get(src);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    this.cache.set(src, promise);
    return promise;
  }

  static async loadCSS(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve();
    }

    if (this.cache.has(href)) {
      return this.cache.get(href);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });

    this.cache.set(href, promise);
    return promise;
  }

  static async preloadResource(url: string, as: string = 'fetch'): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = as;
      link.onload = () => {
        this.loadedResources.add(url);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
}

// ===========================================
// INTERSECTION OBSERVER HOOK
// ===========================================

export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });
    setObserver(obs);

    return () => obs.disconnect();
  }, [callback, options]);

  const observe = (element: Element) => {
    observer?.observe(element);
  };

  const unobserve = (element: Element) => {
    observer?.unobserve(element);
  };

  const disconnect = () => {
    observer?.disconnect();
  };

  return { observe, unobserve, disconnect };
};

// ===========================================
// BUNDLE SPLITTING UTILITIES
// ===========================================

export const createChunkPreloader = () => {
  const preloadedChunks = new Set<string>();

  return {
    preload: async (chunkName: string, importFn: () => Promise<any>) => {
      if (preloadedChunks.has(chunkName)) {
        return;
      }

      try {
        await importFn();
        preloadedChunks.add(chunkName);
      } catch (error) {
        console.error(`Failed to preload chunk: ${chunkName}`, error);
      }
    },

    isPreloaded: (chunkName: string) => preloadedChunks.has(chunkName),

    preloadAll: async (chunks: Record<string, () => Promise<any>>) => {
      const promises = Object.entries(chunks).map(([name, importFn]) => 
        importFn().then(() => preloadedChunks.add(name)).catch(console.error)
      );
      await Promise.allSettled(promises);
    },
  };
};

// ===========================================
// PERFORMANCE OPTIMIZED SUSPENSE
// ===========================================

export interface OptimizedSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  timeout?: number;
  onTimeout?: () => void;
}

export const OptimizedSuspense: React.FC<OptimizedSuspenseProps> = ({
  children,
  fallback,
  delay = 200,
  timeout = 10000,
  onTimeout,
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setShowFallback(true);
    }, delay);

    const timeoutTimer = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [delay, timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Loading Timeout
          </h3>
          <p className="text-neutral-600">
            This is taking longer than expected. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const defaultFallback = (
    <motion.div
      className="flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
        <span className="ml-2 text-sm text-neutral-600">Loading...</span>
      </div>
    </motion.div>
  );

  return (
    <Suspense fallback={showFallback ? (fallback || defaultFallback) : null}>
      {children}
    </Suspense>
  );
};

export default {
  createLazyComponent,
  ProgressiveImage,
  LazyLoad,
  ProgressiveEnhancement,
  ResourceLoader,
  useIntersectionObserver,
  createChunkPreloader,
  OptimizedSuspense,
};
