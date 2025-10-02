// profile/api.ts
import { apiService, User, ApiResponse } from "@/lib/api";

// current login user
export async function getProfile(): Promise<ApiResponse<User>> {
  return apiService.getCurrentUser();
}

// Update the user profile
export async function updateProfile(
  userId: number,
  data: Partial<User>
): Promise<ApiResponse<User>> {
  return apiService.updateUser(userId, data);
}
