import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { renderWorld } from './art';
import { itemsForStage } from './missions';

export interface GameCanvasProps {
  stage: number;
  collected: string[];
  paused: boolean;
  flowerBloomed: boolean;
  celebrating: boolean;
  route: string | null;
  onItem: (id: string) => void;
  onSurprise: () => void;
}

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 640;
const SPEED = 175;
const movementKeys = new Set([
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd',
]);

const editing = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));

/** The canvas owns movement only; all mission state lives in the React app. */
export default function GameCanvas(props: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const player = useRef({ x: 500, y: 440, facing: 1, moving: false });
  const target = useRef<{ x: number; y: number } | null>(null);
  const keyboard = useRef(new Set<string>());
  const pointers = useRef(new Map<number, string>());
  const triggered = useRef(new Set<string>(props.collected));
  const stageRef = useRef(props.stage);
  const sceneTime = useRef(0);
  const previousCollection = useRef({ stage: props.stage, ids: new Set(props.collected) });
  const collectionBursts = useRef<Array<{ x: number; y: number; start: number }>>([]);

  const interact = (radius: number) => {
    const state = latest.current;
    if (state.paused) return;
    const nearest = itemsForStage(state.stage)
      .filter(item => !state.collected.includes(item.id) && !triggered.current.has(item.id))
      .map(item => ({ item, distance: Math.hypot(item.x - player.current.x, item.y - player.current.y) }))
      .filter(entry => entry.distance <= radius)
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest) {
      triggered.current.add(nearest.item.id);
      target.current = null;
      state.onItem(nearest.item.id);
    }
  };
  const interactRef = useRef(interact);
  interactRef.current = interact;

  useEffect(() => {
    if (stageRef.current !== props.stage) {
      stageRef.current = props.stage;
      player.current = { x: 500, y: 440, facing: 1, moving: false };
      target.current = null;
      keyboard.current.clear();
      pointers.current.clear();
      triggered.current = new Set(props.collected);
    } else {
      // A non-collecting hint (for example the thirsty flower) is suppressed
      // until the inventory changes, then can be tried again with new supplies.
      triggered.current = new Set(props.collected);
    }
  }, [props.stage, props.collected]);

  useEffect(() => {
    const previous = previousCollection.current;
    if (previous.stage !== props.stage || props.collected.length < previous.ids.size) {
      collectionBursts.current = [];
    } else {
      for (const id of props.collected) {
        if (previous.ids.has(id)) continue;
        const item = itemsForStage(props.stage).find(candidate => candidate.id === id);
        if (item) collectionBursts.current.push({ x: item.x, y: item.y - 18, start: sceneTime.current });
      }
    }
    previousCollection.current = { stage: props.stage, ids: new Set(props.collected) };
  }, [props.stage, props.collected]);

  useEffect(() => {
    if (props.paused) {
      keyboard.current.clear();
      pointers.current.clear();
      target.current = null;
      player.current.moving = false;
    }
  }, [props.paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let frame = 0;
    let previousTime = 0;
    let logicalTime = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (timestamp: number) => {
      const dt = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.045) : 0;
      previousTime = timestamp;
      if (!document.hidden) logicalTime += dt;
      sceneTime.current = logicalTime;
      const state = latest.current;
      const current = player.current;
      current.moving = false;

      if (!state.paused && !document.hidden) {
        const activeKeys = new Set([...keyboard.current, ...pointers.current.values()]);
        let dx = Number(activeKeys.has('d') || activeKeys.has('arrowright'))
          - Number(activeKeys.has('a') || activeKeys.has('arrowleft'));
        let dy = Number(activeKeys.has('s') || activeKeys.has('arrowdown'))
          - Number(activeKeys.has('w') || activeKeys.has('arrowup'));
        if (dx || dy) {
          target.current = null;
          const magnitude = Math.hypot(dx, dy);
          dx /= magnitude;
          dy /= magnitude;
        } else if (target.current) {
          const distance = Math.hypot(target.current.x - current.x, target.current.y - current.y);
          if (distance <= SPEED * dt + 2) {
            current.x = target.current.x;
            current.y = target.current.y;
            target.current = null;
          } else {
            dx = (target.current.x - current.x) / distance;
            dy = (target.current.y - current.y) / distance;
          }
        }
        if (dx || dy) {
          current.x = Math.max(40, Math.min(960, current.x + dx * SPEED * dt));
          current.y = Math.max(90, Math.min(606, current.y + dy * SPEED * dt));
          if (Math.abs(dx) > 0.02) current.facing = dx < 0 ? -1 : 1;
          current.moving = true;
        }
        interactRef.current(43);
      }

      context.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
      renderWorld(context, {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        stage: state.stage,
        time: logicalTime,
        player: current,
        items: itemsForStage(state.stage).map(item => ({
          ...item,
          collected: state.collected.includes(item.id),
        })),
        target: target.current,
        flowerBloomed: state.flowerBloomed,
        celebrating: state.celebrating,
        route: state.route,
      });
      collectionBursts.current = collectionBursts.current.filter(burst => logicalTime - burst.start < 0.85);
      for (const burst of collectionBursts.current) {
        const progress = Math.max(0, (logicalTime - burst.start) / 0.85);
        context.save();
        context.globalAlpha = (1 - progress) * 0.9;
        context.strokeStyle = '#fff9c4';
        context.lineWidth = 2.5 * (1 - progress) + 0.5;
        context.beginPath();
        context.ellipse(burst.x, burst.y + 14, 12 + progress * 37, 5 + progress * 14, 0, 0, Math.PI * 2);
        context.stroke();
        for (let index = 0; index < 9; index++) {
          const angle = index * Math.PI * 2 / 9;
          const distance = 9 + progress * (32 + (index % 3) * 7);
          const x = burst.x + Math.cos(angle) * distance;
          const y = burst.y + Math.sin(angle) * distance * 0.65 - progress * 38;
          context.fillStyle = index % 2 ? '#fffdf0' : '#ffe49a';
          context.beginPath();
          context.ellipse(x, y, (2.8 + index % 2) * (1 - progress * 0.6), 1.8 * (1 - progress * 0.6), angle + progress, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
      frame = window.requestAnimationFrame(draw);
    };

    const clearInput = () => {
      keyboard.current.clear();
      pointers.current.clear();
      target.current = null;
      player.current.moving = false;
      previousTime = 0;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (latest.current.paused || editing(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (movementKeys.has(key)) {
        event.preventDefault();
        keyboard.current.add(key);
      } else if (key === 'e' || key === ' ') {
        event.preventDefault();
        if (!event.repeat) interactRef.current(80);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keyboard.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', clearInput);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', clearInput);
    };
  }, []);

  const moveToPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (latest.current.paused || event.button > 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * WORLD_WIDTH;
    const y = (event.clientY - rect.top) / rect.height * WORLD_HEIGHT;
    if (Math.hypot(x - 875, y - 160) < 42) latest.current.onSurprise();
    target.current = { x: Math.max(40, Math.min(960, x)), y: Math.max(90, Math.min(606, y)) };
    event.currentTarget.focus({ preventScroll: true });
  };

  const startDirection = (event: ReactPointerEvent<HTMLButtonElement>, direction: string) => {
    event.preventDefault();
    if (latest.current.paused) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, direction);
    target.current = null;
  };
  const endDirection = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointers.current.delete(event.pointerId);
  };

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        className="world-canvas"
        width={1000}
        height={640}
        role="img"
        tabIndex={0}
        aria-label="Pădurea lui Teemo. Mișcă-te cu WASD sau săgețile, ori atinge o destinație. Apropie-te de obiecte pentru a le colecta."
        onPointerUp={moveToPointer}
        style={{ touchAction: 'none', display: 'block', width: '100%', aspectRatio: '1000 / 640' }}
      />
      <div className="touch-controls" role="group" aria-label="Direcții de mers">
        {([
          ['arrowup', 'Sus', '↑'],
          ['arrowleft', 'Stânga', '←'],
          ['arrowdown', 'Jos', '↓'],
          ['arrowright', 'Dreapta', '→'],
        ] as const).map(([direction, label, icon]) => (
          <button
            type="button"
            key={direction}
            className={`dpad-button dpad-${direction.replace('arrow', '')}`}
            aria-label={label}
            disabled={props.paused}
            onPointerDown={event => startDirection(event, direction)}
            onPointerUp={endDirection}
            onPointerCancel={endDirection}
            onLostPointerCapture={endDirection}
            style={{ touchAction: 'none' }}
          >{icon}</button>
        ))}
      </div>
    </div>
  );
}
