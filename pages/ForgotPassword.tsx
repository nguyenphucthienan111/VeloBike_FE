import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { Alert } from '../components/Alert';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordErrors {
  email?: string;
}

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // OTP Step
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Password Reset Step
  const [resetData, setResetData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetErrors, setResetErrors] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmailStep = (): boolean => {
    const newErrors: ForgotPasswordErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmailStep()) return;

    setLoading(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.FORGOT_PASSWORD,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('OTP sent to your email! Check your inbox.');
        setUserEmail(formData.email);
        setTimeout(() => {
          setStep('otp');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateOtpStep = (): boolean => {
    setOtpError('');

    if (!otp.trim()) {
      setOtpError('OTP is required');
      return false;
    }

    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return false;
    }

    return true;
  };

  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateOtpStep()) return;

    setResetData({ ...resetData, otp });
    setStep('password');
  };

  const validatePasswordStep = (): boolean => {
    const newErrors = { otp: '', newPassword: '', confirmPassword: '' };

    if (!resetData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (resetData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(resetData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(resetData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(resetData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(resetData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character (@$!%*?&)';
    }

    if (!resetData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (resetData.newPassword !== resetData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setResetErrors(newErrors);
    return Object.keys(newErrors).filter((key) => newErrors[key as keyof typeof newErrors]).length === 0;
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validatePasswordStep()) return;

    setLoading(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.RESET_PASSWORD,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            code: resetData.otp,  // Backend expects 'code' not 'otp'
            newPassword: resetData.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (step === 'email') {
      navigate('/login');
    } else if (step === 'otp') {
      setStep('email');
      setOtp('');
      setOtpError('');
    } else if (step === 'password') {
      setStep('otp');
      setResetData({ otp: '', newPassword: '', confirmPassword: '' });
      setResetErrors({ otp: '', newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'email' && 'Enter your email address'}
              {step === 'otp' && 'Enter the OTP sent to your email'}
              {step === 'password' && 'Create your new password'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <Alert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}
        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />
        )}

        {/* Step Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === 'email' || step === 'otp' || step === 'password'
                ? 'bg-black'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === 'otp' || step === 'password' ? 'bg-black' : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === 'password' ? 'bg-black' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <FormInput
              label="EMAIL ADDRESS"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Remembered your password?</span>
              <Link to="/login" className="text-sm font-bold text-black hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                OTP CODE
              </label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                maxLength={6}
                className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-center text-2xl tracking-widest transition-colors ${
                  otpError
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-black focus:outline-none'
                }`}
              />
              {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                  className="text-black font-bold hover:underline"
                >
                  Resend
                </button>
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-900 transition-colors"
            >
              Verify OTP
            </button>
          </form>
        )}

        {/* Password Reset Step */}
        {step === 'password' && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <FormInput
              label="NEW PASSWORD"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              value={resetData.newPassword}
              onChange={(e) => {
                setResetData({ ...resetData, newPassword: e.target.value });
                setResetErrors({ ...resetErrors, newPassword: '' });
              }}
              error={resetErrors.newPassword}
              required
            />

            <FormInput
              label="CONFIRM PASSWORD"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={resetData.confirmPassword}
              onChange={(e) => {
                setResetData({ ...resetData, confirmPassword: e.target.value });
                setResetErrors({ ...resetErrors, confirmPassword: '' });
              }}
              error={resetErrors.confirmPassword}
              required
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800 font-medium">
                Password requirements:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (@$!%*?&)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
