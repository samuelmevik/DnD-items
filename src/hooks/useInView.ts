import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

/**
 * Hook that tracks when an element enters the viewport.
 * Defaults to once=true with a 200px rootMargin so images start loading
 * just before the user scrolls them into view.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
): [React.RefObject<T>, boolean] {
  const { rootMargin = "200px", threshold = 0, once = true } = options;
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once]);

  return [ref, isInView];
}
