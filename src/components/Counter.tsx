import React from 'react';
import { useInView, animate } from 'motion/react';

export default function Counter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => setCount(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [value, duration, isInView]);

  return <span ref={ref}>{count}</span>;
}
