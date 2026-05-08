import { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { getBrandSimpleIconUrl, getBrandFaviconUrl } from '../lib/carBrand';

interface CarBrandLogoProps {
  marca: string | null | undefined;
  size?: number;
  className?: string;
  fallbackEmoji?: string;
}

export function CarBrandLogo({
  marca,
  size = 32,
  className,
  fallbackEmoji = '🚗',
}: CarBrandLogoProps) {
  const sources = useMemo(() => {
    return [getBrandSimpleIconUrl(marca), getBrandFaviconUrl(marca)].filter(
      (s): s is string => !!s
    );
  }, [marca]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [marca]);

  const currentSrc = sources[index] ?? null;
  const handleError = () => setIndex((i) => i + 1);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0',
        className
      )}
      style={{ width: size, height: size }}
    >
      {currentSrc ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={marca ?? ''}
          width={size}
          height={size}
          className="object-contain p-1.5"
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <span className="text-lg" aria-hidden>
          {fallbackEmoji}
        </span>
      )}
    </div>
  );
}
