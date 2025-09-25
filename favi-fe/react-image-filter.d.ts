declare module 'react-image-filter' {
  import React from 'react';

  interface ImageFilterProps {
    image: string;
    filter: string;
    style?: React.CSSProperties;
  }

  const ImageFilter: React.FC<ImageFilterProps>;
  export default ImageFilter;
}