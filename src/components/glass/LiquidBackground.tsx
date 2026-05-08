export function LiquidBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#liquid-blob)' }}
      >
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-accent-violet/55 blur-3xl animate-blob-1 motion-reduce:animate-none"
          style={{ willChange: 'transform' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-accent-cyan/50 blur-3xl animate-blob-2 motion-reduce:animate-none"
          style={{ willChange: 'transform' }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full bg-accent-pink/45 blur-3xl animate-blob-3 motion-reduce:animate-none"
          style={{ willChange: 'transform' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-radial" />
    </div>
  );
}
