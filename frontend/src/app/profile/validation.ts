export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateProfileForm = (formData: {
  first_name: string;
  last_name: string;
  email: string;
}) => {
  const errors: Record<string, string> = {};
  
  if (!formData.first_name.trim()) {
    errors.first_name = "First name is required";
  }
  
  if (!formData.last_name.trim()) {
    errors.last_name = "Last name is required";
  }
  
  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  return errors;
};

export const TITLE_OPTIONS = [
  { value: "Mr.", label: "Mr." },
  { value: "Ms.", label: "Ms." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Dr.", label: "Dr." },
];

export const YEAR_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: "internal", label: "Kasetsart University" },
  { value: "external", label: "External Organization" },
];

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file' };
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }
  
  return { valid: true };
};
