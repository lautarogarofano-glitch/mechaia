export function LightLiquidBackground() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50"
      aria-hidden
    >
      <div
        className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full bg-violet-200/55 blur-3xl animate-blob-1 motion-reduce:animate-none"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-cyan-200/50 blur-3xl animate-blob-2 motion-reduce:animate-none"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-pink-200/45 blur-3xl animate-blob-3 motion-reduce:animate-none"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(248,250,252,0.7) 100%)',
        }}
      />
    </div>
  );
}
