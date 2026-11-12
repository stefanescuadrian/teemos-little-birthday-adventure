import { useEffect, useState } from 'react';
export default function Typewriter({ text, instant = false }: { text: string; instant?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(text.length); return; }
    setCount(0);
    const start = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(text.length, Math.floor((performance.now() - start) / 17));
      setCount(next);
      if (next >= text.length) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [text, instant]);
  return <span aria-label={text}><span aria-hidden="true">{text.slice(0, count)}{count < text.length && <span className="typing-cursor">▍</span>}</span></span>;
}
