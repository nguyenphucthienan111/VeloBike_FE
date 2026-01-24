import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { Alert } from '../components/Alert';
import { useAuth } from '../hooks/useAuth';

type RegistrationStep = 'form' | 'verification';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'BUYER' | 'SELLER';
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

export const Register: React.FC = () => {
  const { register, verifyEmail, resendOtp, loading, error: authError, clearError } = useAuth();
  const [step, setStep] = useState<RegistrationStep>('form');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER',
    agreeToTerms: false,
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Step 1: Register user
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    clearError();
    const result = await register({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      role: formData.role,
    });

    if (result.success && result.userId) {
      setUserId(result.userId);
      setStep('verification');
      setSuccessMessage('Account created! Please verify your email.');
    }
  };

  // Step 2: Verify email with OTP
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim()) {
      setOtpError('OTP code is required');
      return;
    }

    setOtpError('');
    setSuccessMessage('Email verified! Redirecting to login...');
    await verifyEmail(formData.email, otpCode);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    clearError();
    const success = await resendOtp(formData.email);
    if (success) {
      setSuccessMessage('OTP has been resent to your email');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'form' ? 'bg-black' : 'bg-gray-300'}`}></div>
          <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'verification' ? 'bg-black' : 'bg-gray-300'}`}></div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join VeloBike</h1>
            <p className="text-gray-600 text-sm">The premium marketplace for cyclists</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4">
              <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
            </div>
          )}

          {/* Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-5">
              {authError && (
                <Alert
                  type="error"
                  message={authError}
                  onClose={clearError}
                />
              )}

              <FormInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                error={errors.fullName}
                required
              />

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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-black transition-colors"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                </select>
              </div>

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                error={errors.password}
                helperText="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                required
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
              />

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 accent-black cursor-pointer"
                />
                <label className="text-xs text-gray-600 cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="text-black font-semibold underline hover:no-underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-black font-semibold underline hover:no-underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeToTerms && <p className="text-red-500 text-xs">{errors.agreeToTerms}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3 uppercase tracking-widest rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Email Verification Form */}
          {step === 'verification' && (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <Alert
                type="info"
                message={`We've sent a verification code to ${formData.email}`}
              />

              {authError && (
                <Alert
                  type="error"
                  message={authError}
                  onClose={clearError}
                />
              )}

              <FormInput
                label="Verification Code"
                name="otpCode"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError('');
                }}
                placeholder="000000"
                maxLength={6}
                error={otpError}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3 uppercase tracking-widest rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 font-bold py-3 uppercase tracking-widest rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtpCode('');
                  setOtpError('');
                  clearError();
                }}
                className="text-sm text-gray-600 hover:text-black w-full text-center py-2"
              >
                Back to Registration
              </button>
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};