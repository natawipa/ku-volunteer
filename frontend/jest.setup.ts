import React from 'react';
import '@testing-library/jest-dom';

// Global mock for next/image used in tests.
// React warns when unknown boolean props (like `unoptimized`) are forwarded to DOM elements.
// Strip `unoptimized` (and any other Next-only props) so tests don't show the warning.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: any) => {
		const { unoptimized, loader, placeholder, srcSet, sizes, ...rest } = props || {};
		return React.createElement('img', rest);
	},
}));
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
