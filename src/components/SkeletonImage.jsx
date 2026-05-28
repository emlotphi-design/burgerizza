import { useState } from 'react';

export default function SkeletonImage({
  src,
  alt,
  className,
  imgStyle,
  wrapperStyle,
  skeletonRadius = '12px',
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0, ...wrapperStyle }}>
      {!loaded && (
        <div
          className="sk"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, borderRadius: skeletonRadius }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...imgStyle,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.28s ease',
          display: 'block',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}
