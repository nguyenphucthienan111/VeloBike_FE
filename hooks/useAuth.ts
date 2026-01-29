import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../constants';
import { validateMockCredentials, mockLoginResponse } from '../services/mockAuth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'BUYER' | 'SELLER';
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<{ userId?: string; success: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Check for mock credentials (for development/testing)
        if (validateMockCredentials(credentials.email, credentials.password)) {
          console.log('🎯 Using MOCK login for testing');
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Store mock tokens and user data
          localStorage.setItem('accessToken', mockLoginResponse.accessToken);
          localStorage.setItem('refreshToken', mockLoginResponse.refreshToken);
          localStorage.setItem('user', JSON.stringify(mockLoginResponse.user));
          
          // Dispatch event to notify Layout component
          window.dispatchEvent(new Event('authChange'));
          
          navigate('/');
          return true;
        }

        // Otherwise, use real API
        const response = await fetch(API_ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        const data: AuthResponse = await response.json();

        if (!response.ok) {
          setError(data.message || 'Login failed');
          return false;
        }

        // Store tokens
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

        // Store user info
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch event to notify Layout component
        window.dispatchEvent(new Event('authChange'));

        navigate('/');
        return true;
      } catch (err: any) {
        setError(err.message || 'An error occurred during login');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<{ userId?: string; success: boolean }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ENDPOINTS.REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const responseData: AuthResponse = await response.json();

        if (!response.ok) {
          setError(responseData.message || 'Registration failed');
          return { success: false };
        }

        return { userId: responseData.user?.id, success: true };
      } catch (err: any) {
        setError(err.message || 'An error occurred during registration');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        setError(data.message || 'Verification failed');
        return false;
      }

      // Store tokens
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      // Show success message and redirect after 2 seconds
      setError(null); // Clear any previous errors
      
      // Dispatch event to notify Layout component
      window.dispatchEvent(new Event('authStatusChanged'));
      
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified! Please login with your credentials.' } });
      }, 2000);
      
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const resendOtp = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.RESEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email' }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to resend OTP');
        return false;
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    login,
    register,
    verifyEmail,
    resendOtp,
    logout,
    clearError,
  };
};
