import { useState, useEffect } from 'react';

export function useMountDelay(ms = 280) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return ready;
}
