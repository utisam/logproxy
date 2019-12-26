import { useState, useCallback } from "react";

export function useQueue<T>(maximum: number, initial: T[] = []): [T[], (item: T) => void] {
  const [queue, setQueue] = useState(initial);

  const enqueue = useCallback((item: T) => {
    setQueue((queue) => [...queue.slice(-(maximum - 1)), item]);
  }, [maximum, setQueue]);

  return [queue, enqueue]
}