// Mock API for testing authentication
// Email: kien123@test.com (or kien123)
// Password: 1

export const mockLoginResponse = {
  success: true,
  message: "Login successful",
  user: {
    id: "user_mock_001",
    email: "kien123@test.com",
    fullName: "Kiên Phạm",
    role: "BUYER",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiên",
    phone: "+84123456789",
    emailVerified: true,
  },
  accessToken: "mock_access_token_kien123_" + Date.now(),
  refreshToken: "mock_refresh_token_kien123_" + Date.now(),
};

export const MOCK_CREDENTIALS = {
  BUYER: {
    email: "kien123",
    password: "1",
  },
};

export const validateMockCredentials = (email: string, password: string) => {
  // Accept both "kien123" or "kien123@test.com" as email
  const isValidEmail = 
    email === MOCK_CREDENTIALS.BUYER.email || 
    email === "kien123@test.com";
  const isValidPassword = password === MOCK_CREDENTIALS.BUYER.password;

  return isValidEmail && isValidPassword;
};
