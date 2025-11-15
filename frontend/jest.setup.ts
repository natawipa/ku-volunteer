import React from 'react';
import '@testing-library/jest-dom';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const {
      priority,
      unoptimized,
      placeholder,
      blurDataURL,
      loader,
      fill,
      quality,
      sizes,
      srcSet,
      ...rest
    } = props;

    return React.createElement('img', rest);
  },
}));

jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});
