import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { Alert } from '../components/Alert';
import { GoogleLogin } from '../components/GoogleLogin';
import { FacebookLogin } from '../components/FacebookLogin';
import { useAuth } from '../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

export const Login: React.FC = () => {
  const { login, loading, error: authError, clearError } = useAuth();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    clearError();
    await login(formData);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm">Sign in to manage your garage and orders</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Alert */}
            {authError && (
              <Alert
                type="error"
                message={authError}
                onClose={clearError}
              />
            )}

            {/* Email */}
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              error={errors.email}
              required
            />

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gray-600 hover:text-black font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full border px-4 py-3 text-sm rounded-lg focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-3 uppercase tracking-widest rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <GoogleLogin 
              onError={(error) => console.error('Google login failed:', error)}
            />
            <FacebookLogin 
              onError={(error) => console.error('Facebook login failed:', error)}
            />
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-black font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};