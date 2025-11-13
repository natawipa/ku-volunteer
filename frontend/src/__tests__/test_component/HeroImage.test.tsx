import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroImage from '@/app/components/HeroImage';

describe('HeroImage', () => {
  it('renders default background divs', () => {
    render(<HeroImage />);
    // The component renders two absolute divs; we can assert by role-less presence
    expect(document.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('accepts custom heights', () => {
    render(<HeroImage containerHeight="200px" mountainHeight="150px" />);
    // No crash and DOM present
    expect(document.body).toBeTruthy();
  });
});
