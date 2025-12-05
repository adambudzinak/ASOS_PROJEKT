import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoading: boolean;
    threshold?: number;
}

export const useInfiniteScroll = ({
                                      onLoadMore,
                                      hasNextPage,
                                      isLoading,
                                      threshold = 500
                                  }: UseInfiniteScrollProps) => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastCallTime = useRef<number>(0);

    const handleObserve = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const entry = entries[0];

            // Ak je element viditelny a mame dalsie stranky a neni loading
            if (entry.isIntersecting && hasNextPage && !isLoading) {
                const now = Date.now();
                // Zabran viacerym callsom - minimalne 1 sekunda medzi requestami
                if (now - lastCallTime.current > 1000) {
                    lastCallTime.current = now;
                    onLoadMore();
                }
            }
        },
        [hasNextPage, isLoading, onLoadMore]
    );

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserve, {
            rootMargin: `${threshold}px`
        });

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [handleObserve, threshold]);

    return observerTarget;
};