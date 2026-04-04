import { useEffect, useEffectEvent } from 'react';

const usePolling = (callback, delay = 15000, enabled = true) => {
  const onPoll = useEffectEvent(() => {
    callback();
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      onPoll();
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, enabled]);
};

export default usePolling;
