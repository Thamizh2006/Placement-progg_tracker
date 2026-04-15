import { useEffect, useEffectEvent } from 'react';

const usePolling = (callback, delay = 15000, enabled = true) => {
  const onPoll = useEffectEvent(() => {
    callback();
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const runPoll = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      onPoll();
    };

    const timer = window.setInterval(() => {
      runPoll();
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, enabled, onPoll]);
};

export default usePolling;
