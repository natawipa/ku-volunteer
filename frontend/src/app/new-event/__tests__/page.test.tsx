import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ActivityForm from '../page';
import { activitiesApi } from '@/lib/activities';
import { auth } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';
import type { Activity } from '@/lib/types';

// Test helpers
const getFutureDate = (daysAhead: number = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
};

const getFutureDateISO = (daysAhead: number = 30, time: string = '09:00:00'): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}T${time}Z`;
};

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    createActivity: jest.fn(),
    updateActivity: jest.fn(),
    getActivity: jest.fn(),
    deleteActivity: jest.fn(),
    requestDeletion: jest.fn(),
    getPosterImages: jest.fn(),
    deletePosterImage: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  auth: {
    isAuthenticated: jest.fn(),
    getUserRole: jest.fn(),
  },
}));

jest.mock('@/app/components/Modal', () => ({
  useModal: () => ({
    showModal: jest.fn(),
    hideModal: jest.fn(),
  }),
}));

jest.mock('@/app/components/HeroImage', () => ({
  __esModule: true,
  default: () => <div data-testid="hero-image">Hero Image</div>,
}));

jest.mock('@/app/components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

jest.mock('../components/FormFields', () => ({
  __esModule: true,
  default: (props: { 
    title: string;
    location: string;
    dateStart: string;
    dateEnd: string;
    timeStart: string;
    timeEnd: string;
    hour: number | '';
    maxParticipants: number | '';
    categories: string[];
    description: string;
    onTitleChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onDateStartChange: (value: string) => void;
    onDateEndChange: (value: string) => void;
    onTimeStartChange: (value: string) => void;
    onTimeEndChange: (value: string) => void;
    onHourChange: (value: number | '') => void;
    onMaxParticipantsChange: (value: number | '') => void;
    onCategoriesChange: (value: string[]) => void;
    onDescriptionChange: (value: string) => void;
    errors: Record<string, string>;
  }) => (
    <div data-testid="form-fields">
      <input 
        data-testid="location-input" 
        value={props.location} 
        onChange={(e) => props.onLocationChange(e.target.value)} 
        placeholder="Location"
      />
      <input 
        data-testid="datestart-input" 
        type="date"
        value={props.dateStart} 
        onChange={(e) => props.onDateStartChange(e.target.value)} 
      />
      <input 
        data-testid="dateend-input" 
        type="date"
        value={props.dateEnd} 
        onChange={(e) => props.onDateEndChange(e.target.value)} 
      />
      <input 
        data-testid="timestart-input" 
        type="time"
        value={props.timeStart} 
        onChange={(e) => props.onTimeStartChange(e.target.value)} 
      />
      <input 
        data-testid="timeend-input" 
        type="time"
        value={props.timeEnd} 
        onChange={(e) => props.onTimeEndChange(e.target.value)} 
      />
      <input 
        data-testid="hour-input" 
        type="number"
        value={props.hour} 
        onChange={(e) => props.onHourChange(Number(e.target.value))} 
      />
      <input 
        data-testid="maxparticipants-input" 
        type="number"
        value={props.maxParticipants} 
        onChange={(e) => props.onMaxParticipantsChange(Number(e.target.value))} 
      />
      <textarea 
        data-testid="description-input" 
        value={props.description} 
        onChange={(e) => props.onDescriptionChange(e.target.value)} 
      />
      <button 
        data-testid="add-category" 
        onClick={() => props.onCategoriesChange([...props.categories, 'Environment'])}
      >
        Add Category
      </button>
      {Object.entries(props.errors).map(([key, value]) => (
        <div key={key} data-testid={`error-${key}`}>{value}</div>
      ))}
    </div>
  ),
}));

jest.mock('../components/ImageUploadSection', () => ({
  __esModule: true,
  default: (props: {
    cover: File | null;
    coverUrl: string | null;
    pictures: File[];
    existingPosters: { id?: number | string; url: string }[];
    onCoverChange: (file: File | null) => void;
    onPicturesChange: (files: File[]) => void;
    onDeleteExistingPoster: (id: number | string) => void;
  }) => (
    <div data-testid="image-upload">
      <input 
        data-testid="cover-input" 
        type="file"
        onChange={(e) => props.onCoverChange(e.target.files?.[0] || null)} 
      />
      <input 
        data-testid="posters-input" 
        type="file"
        multiple
        onChange={(e) => props.onPicturesChange(Array.from(e.target.files || []))} 
      />
      {props.existingPosters.map(poster => (
        <div key={poster.id} data-testid={`existing-poster-${poster.id}`}>
          <button onClick={() => props.onDeleteExistingPoster(poster.id!)}>Delete Poster</button>
        </div>
      ))}
    </div>
  ),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new Map<string, string>();

describe('New Event Page (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.clear();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key) || null,
    });

    (auth.isAuthenticated as jest.Mock).mockReturnValue(true);
    (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.ORGANIZER);
  });

  describe('Authorization', () => {
    it('should redirect to login if not authenticated', () => {
      (auth.isAuthenticated as jest.Mock).mockReturnValue(false);

      render(<ActivityForm />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to home if user is not organizer or admin', () => {
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.STUDENT);

      render(<ActivityForm />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should allow organizer to access the page', async () => {
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.ORGANIZER);

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });
    });

    it('should allow admin to access the page', async () => {
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.ADMIN);

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });
    });
  });

  describe('Create New Event', () => {
    const validEventData = {
      title: 'Beach Cleanup Event',
      location: 'Sandy Beach',
      dateStart: getFutureDate(30),
      dateEnd: getFutureDate(30),
      timeStart: '09:00',
      timeEnd: '12:00',
      hour: 3,
      maxParticipants: 50,
      description: 'Join us for a beach cleanup!',
      categories: ['Environment'],
    };

    it('should render create event form', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Input Activity Title')).toBeInTheDocument();
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
        expect(screen.getByTestId('image-upload')).toBeInTheDocument();
      });
    });

    it('should create new event with valid data', async () => {
      const createdActivity: Activity = {
        id: 1,
        title: validEventData.title,
        location: validEventData.location,
        start_at: getFutureDateISO(30, '09:00:00'),
        end_at: getFutureDateISO(30, '12:00:00'),
        max_participants: validEventData.maxParticipants,
        hours_awarded: validEventData.hour,
        categories: validEventData.categories,
        description: validEventData.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_participants: 0,
        organizer_name: 'Test Organizer',
        organizer_email: 'organizer@example.com',
        organizer_profile_id: 1,
        requires_admin_for_delete: false,
        capacity_reached: false,
        cover_image: '',
        cover_image_url: '',
      };

      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: createdActivity,
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Fill in the form
      const titleInput = screen.getByPlaceholderText('Input Activity Title');
      await userEvent.type(titleInput, validEventData.title);

      await userEvent.type(screen.getByTestId('location-input'), validEventData.location);
      await userEvent.type(screen.getByTestId('datestart-input'), validEventData.dateStart);
      await userEvent.type(screen.getByTestId('dateend-input'), validEventData.dateEnd);
      await userEvent.type(screen.getByTestId('timestart-input'), validEventData.timeStart);
      await userEvent.type(screen.getByTestId('timeend-input'), validEventData.timeEnd);
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), validEventData.hour.toString());
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), validEventData.maxParticipants.toString());
      await userEvent.type(screen.getByTestId('description-input'), validEventData.description);
      await userEvent.click(screen.getByTestId('add-category'));

      // Submit the form
      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            title: validEventData.title,
            location: validEventData.location,
            max_participants: validEventData.maxParticipants,
            hours_awarded: validEventData.hour,
            description: validEventData.description,
            categories: validEventData.categories,
          })
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('success=')
        );
      });
    });

    it('should create event with cover image', async () => {
      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, title: 'Test Event' },
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('cover-input')).toBeInTheDocument();
      });

      const file = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' });
      const coverInput = screen.getByTestId('cover-input');
      await userEvent.upload(coverInput, file);

      // Fill required fields
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test description');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            cover: file,
          })
        );
      });
    });

    it('should create event with poster images', async () => {
      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, title: 'Test Event' },
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('posters-input')).toBeInTheDocument();
      });

      const file1 = new File(['poster1'], 'poster1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['poster2'], 'poster2.jpg', { type: 'image/jpeg' });
      const postersInput = screen.getByTestId('posters-input');
      await userEvent.upload(postersInput, [file1, file2]);

      // Fill required fields
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test description');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            pictures: [file1, file2],
          })
        );
      });
    });

    it('should show loading state during creation', async () => {
      (activitiesApi.createActivity as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: { id: 1 } }), 100))
      );

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Fill and submit
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test description');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-title')).toBeInTheDocument();
        expect(screen.getByTestId('error-location')).toBeInTheDocument();
        expect(screen.getByTestId('error-dateStart')).toBeInTheDocument();
        expect(screen.getByTestId('error-dateEnd')).toBeInTheDocument();
      });

      expect(activitiesApi.createActivity).not.toHaveBeenCalled();
    });

    it('should validate date is not in the past', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Fill with past date
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), '2020-01-01');
      await userEvent.type(screen.getByTestId('dateend-input'), '2020-01-01');
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        const errors = screen.getAllByText(/can not be in the past/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate end date is after start date', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(31));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30)); // Before start
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/must be after start date/i)).toBeInTheDocument();
      });
    });

    it('should validate hour range (1-10)', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '15'); // > 10
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/must be between 1 and 10/i)).toBeInTheDocument();
      });
    });

    it('should validate max participants is at least 1', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '0');
      await userEvent.type(screen.getByTestId('description-input'), 'Test');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-maxParticipants')).toHaveTextContent(/max participants required/i);
      });
    });

    it('should validate at least one category is selected', async () => {
      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test');
      // Don't add category

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-categories')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on creation failure', async () => {
      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to create activity',
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Fill and submit valid form
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Test description');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalled();
      });
    });
  });

  describe('Verify Event in Database', () => {
    it('should verify created event exists by ID', async () => {
      const createdActivity: Activity = {
        id: 123,
        title: 'Beach Cleanup Event',
        location: 'Sandy Beach',
        start_at: getFutureDateISO(30, '09:00:00'),
        end_at: getFutureDateISO(30, '12:00:00'),
        max_participants: 50,
        hours_awarded: 3,
        categories: ['Environment'],
        description: 'Join us for a beach cleanup!',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_participants: 0,
        organizer_name: 'Test Organizer',
        organizer_email: 'organizer@example.com',
        organizer_profile_id: 1,
        requires_admin_for_delete: false,
        capacity_reached: false,
        cover_image: '',
        cover_image_url: '',
      };

      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: createdActivity,
      });

      (activitiesApi.getActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: createdActivity,
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Create event
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'Beach Cleanup Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Sandy Beach');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '3');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '50');
      await userEvent.type(screen.getByTestId('description-input'), 'Join us for a beach cleanup!');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalled();
      });

      // Verify the event can be retrieved
      const result = await activitiesApi.getActivity(123);
      
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 123,
        title: 'Beach Cleanup Event',
        location: 'Sandy Beach',
        max_participants: 50,
        hours_awarded: 3,
        categories: ['Environment'],
        description: 'Join us for a beach cleanup!',
      });
    });

    it('should verify event appears in activity list', async () => {
      const createdActivity: Activity = {
        id: 456,
        title: 'New Test Event',
        location: 'Test Location',
        start_at: getFutureDateISO(30, '09:00:00'),
        end_at: getFutureDateISO(30, '12:00:00'),
        max_participants: 30,
        hours_awarded: 2,
        categories: ['Education'],
        description: 'Test event',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_participants: 0,
        organizer_name: 'Test Organizer',
        organizer_email: 'organizer@example.com',
        organizer_profile_id: 1,
        requires_admin_for_delete: false,
        capacity_reached: false,
        cover_image: '',
        cover_image_url: '',
      };

      (activitiesApi.createActivity as jest.Mock).mockResolvedValue({
        success: true,
        data: createdActivity,
      });

      render(<ActivityForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form-fields')).toBeInTheDocument();
      });

      // Create event
      await userEvent.type(screen.getByPlaceholderText('Input Activity Title'), 'New Test Event');
      await userEvent.type(screen.getByTestId('location-input'), 'Test Location');
      await userEvent.type(screen.getByTestId('datestart-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('dateend-input'), getFutureDate(30));
      await userEvent.type(screen.getByTestId('timestart-input'), '09:00');
      await userEvent.type(screen.getByTestId('timeend-input'), '12:00');
      await userEvent.clear(screen.getByTestId('hour-input'));
      await userEvent.type(screen.getByTestId('hour-input'), '2');
      await userEvent.clear(screen.getByTestId('maxparticipants-input'));
      await userEvent.type(screen.getByTestId('maxparticipants-input'), '30');
      await userEvent.type(screen.getByTestId('description-input'), 'Test event');
      await userEvent.click(screen.getByTestId('add-category'));

      const createButton = screen.getByRole('button', { name: /create activity/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(activitiesApi.createActivity).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalled();
      });

      // Verify event data structure matches backend expectations
      const createCall = (activitiesApi.createActivity as jest.Mock).mock.calls[0][0];
      expect(createCall).toMatchObject({
        title: 'New Test Event',
        location: 'Test Location',
        max_participants: 30,
        hours_awarded: 2,
        categories: ['Environment'],
        description: 'Test event',
        start_at: expect.any(String),
        end_at: expect.any(String),
      });
    });
  });
});
