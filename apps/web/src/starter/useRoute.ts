import { useEffect, useState } from 'react';

/**
 * The smallest router that gives every mission its own URL. Two routes exist:
 * `/` is the map and `/mission/<levelId>` is a mission. Back and forward work
 * because navigation goes through the History API, and a reload lands on the
 * same screen because the service worker serves the app shell for any path.
 */
const NAVIGATE_EVENT = 'codequest:navigate';

export const missionPath = (levelId: string): string => `/mission/${levelId}`;

export const levelIdFromPath = (path: string): string | null => {
  const match = /^\/mission\/([a-z0-9-]+)\/?$/.exec(path);
  return match ? match[1] : null;
};

export const navigate = (path: string): void => {
  if (window.location.pathname === path) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
};

export const useRoute = (): string => {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  return path;
};
