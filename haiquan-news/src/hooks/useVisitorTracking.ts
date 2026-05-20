import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

export function useVisitorTracking() {
  const [location] = useLocation();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (trackedPaths.current.has(location)) return;
    trackedPaths.current.add(location);

    const payload = {
      path: location,
      referrer: document.referrer || null,
      screenWidth: window.innerWidth,
      userAgent: navigator.userAgent,
      language: navigator.language,
    };

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [location]);
}
