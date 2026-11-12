import { useEffect, useRef } from 'react';
import { drawTeemo } from '../game/art';
export default function TeemoPortrait({ offering = false, className = '' }: { offering?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 200, 200);
    drawTeemo(ctx, 100, 185, 1.9, 1, false, offering, 1);
  }, [offering]);
  return <canvas ref={ref} width={200} height={200} className={`teemo-portrait ${className}`} aria-label={offering ? 'Teemo tău, oferind o floare' : 'Teemo, micul explorator'} role="img" />;
}
