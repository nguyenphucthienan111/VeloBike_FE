// Mock API for testing authentication
// Buyer Email: kien123@test.com (or kien123)
// Password: 1
// Admin Email: admin
// Password: 1
// Inspector Email: ins
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

export const mockAdminLoginResponse = {
  success: true,
  message: "Login successful",
  user: {
    id: "user_mock_admin_001",
    email: "admin",
    fullName: "Admin User",
    role: "ADMIN",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    phone: "+84987654321",
    emailVerified: true,
  },
  accessToken: "mock_access_token_admin_" + Date.now(),
  refreshToken: "mock_refresh_token_admin_" + Date.now(),
};

export const mockInspectorLoginResponse = {
  success: true,
  message: "Login successful",
  user: {
    id: "user_mock_inspector_001",
    email: "ins",
    fullName: "Inspector User",
    role: "INSPECTOR",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Inspector",
    phone: "+84987654322",
    emailVerified: true,
  },
  accessToken: "mock_access_token_inspector_" + Date.now(),
  refreshToken: "mock_refresh_token_inspector_" + Date.now(),
};

export const MOCK_CREDENTIALS = {
  BUYER: {
    email: "kien123",
    password: "1",
  },
  ADMIN: {
    email: "admin",
    password: "1",
  },
  INSPECTOR: {
    email: "ins",
    password: "1",
  },
};

export const validateMockCredentials = (email: string, password: string) => {
  // Check ADMIN credentials
  if (email === MOCK_CREDENTIALS.ADMIN.email && password === MOCK_CREDENTIALS.ADMIN.password) {
    return { valid: true, role: "ADMIN" };
  }
  
  // Check INSPECTOR credentials
  if (email === MOCK_CREDENTIALS.INSPECTOR.email && password === MOCK_CREDENTIALS.INSPECTOR.password) {
    return { valid: true, role: "INSPECTOR" };
  }
  
  // Check BUYER credentials
  const isValidEmail = 
    email === MOCK_CREDENTIALS.BUYER.email || 
    email === "kien123@test.com";
  const isValidPassword = password === MOCK_CREDENTIALS.BUYER.password;

  if (isValidEmail && isValidPassword) {
    return { valid: true, role: "BUYER" };
  }

  return { valid: false, role: null };
};
