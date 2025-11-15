import React from 'react';
import { render, screen } from '@testing-library/react';
import EventActionButton from './ActionButton';
import { ACTIVITY_STATUS, USER_ROLES } from '../../../lib/constants';
import type { Activity } from '../../../lib/types';

const baseActivity: Activity = {
  id: 999,
  organizer_profile_id: 1,
  organizer_email: 'organizer@example.com',
  organizer_name: 'Test Org',
  categories: ['Test'],
  title: 'Test Event',
  description: 'An event to verify button states',
  start_at: new Date().toISOString(),
  end_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  location: 'Test Venue',
  status: ACTIVITY_STATUS.OPEN,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  current_participants: 0,
  requires_admin_for_delete: false,
  capacity_reached: false,
};

const renderButton = (overrides: Partial<Activity> = {}, props: { applying?: boolean } = {}) => {
  const activity = { ...baseActivity, ...overrides };
  render(
    <EventActionButton
      event={activity}
      role={USER_ROLES.STUDENT}
      onApply={jest.fn()}
      applying={props.applying}
    />
  );
  return screen.getByRole('button', { name: /apply now/i });
};

describe('EventActionButton - Apply Now state', () => {
  it('enables the apply button when the event is open and capacity is available', () => {
    const button = renderButton();
    expect(button).toBeEnabled();
  });

  it('disables the button when the event has reached capacity', () => {
    const button = renderButton({ capacity_reached: true });
    expect(button).toBeDisabled();
  });

  it('disables the button when the event is not open or upcoming', () => {
    const button = renderButton({ status: ACTIVITY_STATUS.CLOSED });
    expect(button).toBeDisabled();
  });

  it('disables the button while the application is submitting', () => {
    const button = renderButton({}, { applying: true });
    expect(button).toBeDisabled();
  });
});
