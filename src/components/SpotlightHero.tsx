import { useEffect, useRef } from 'react';

// Front layer: white/silver android — always fully visible.
const HERO_FRONT =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/658f62c6-fdb2-41b9-aa0f-10837f9e72cb.png';
// Back layer: dark/armored variant — only revealed inside the cursor spotlight.
const HERO_BACK =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260914_123603_5ac5732a-900b-4919-9d9c-3c454194b0a5.png';

const SPOTLIGHT_R = 185; // px, in the element's own (unscaled) coordinate space

export default function SpotlightHero({ className = '' }: { className?: string }) {
  const stackRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stack = stackRef.current;
    const back = backRef.current;
    const canvas = canvasRef.current;
    if (!stack || !back || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mouse = { x: -9999, y: -9999 };
    const smooth = { x: -9999, y: -9999 };
    let rafId = 0;

    const resizeCanvas = () => {
      canvas.width = stack.offsetWidth;
      canvas.height = stack.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handlePointerMove = (e: PointerEvent) => {
      const r = stack.getBoundingClientRect();
      // If anything up the tree ever CSS-transform-scales this element,
      // rendered pixels (rect) and the canvas's own pixel space (offsetWidth)
      // diverge — dividing by that ratio keeps the spotlight tracking the
      // cursor exactly. Harmless (ratio = 1) when nothing is scaled.
      const sx = stack.offsetWidth / r.width;
      const sy = stack.offsetHeight / r.height;
      mouse.x = (e.clientX - r.left) * sx;
      mouse.y = (e.clientY - r.top) * sy;
    };
    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    stack.addEventListener('pointermove', handlePointerMove);
    stack.addEventListener('pointerleave', handlePointerLeave);

    function render(x: number, y: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const grad = ctx!.createRadialGradient(x, y, 0, x, y, SPOTLIGHT_R);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.62, 'rgba(255,255,255,1)');
      grad.addColorStop(0.8, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(x, y, SPOTLIGHT_R, 0, Math.PI * 2);
      ctx!.fill();

      const url = canvas!.toDataURL();
      back!.style.maskImage = `url(${url})`;
      back!.style.webkitMaskImage = `url(${url})`;
    }

    function loop() {
      smooth.x += (mouse.x - smooth.x) * 0.1;
      smooth.y += (mouse.y - smooth.y) * 0.1;
      render(smooth.x, smooth.y);
      rafId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      stack.removeEventListener('pointermove', handlePointerMove);
      stack.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={stackRef} className="relative h-full w-full">
        <img
          src={HERO_FRONT}
          alt="MOSAIC android"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          style={{ filter: 'drop-shadow(12px 17px 24px rgba(0,0,0,0.35))' }}
          draggable={false}
        />
        <img
          ref={backRef}
          src={HERO_BACK}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          style={{
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
          }}
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
}