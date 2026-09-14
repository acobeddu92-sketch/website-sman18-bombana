'use client';

import React, { useState } from 'react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: React.ReactNode;
}

export default function SafeImage({
  src,
  alt,
  className,
  fallback,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
