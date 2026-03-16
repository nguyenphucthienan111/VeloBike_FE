import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
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
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Check password strength in realtime
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    // Check if passwords match in realtime
    if (name === 'confirmPassword' && formData.password) {
      if (value && value !== formData.password) {
        setErrors((prev: FormErrors) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev: FormErrors) => ({ ...prev, confirmPassword: undefined }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors] && name !== 'confirmPassword') {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
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
    <>
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
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  error={errors.password}
                  required
                />
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}>
                        {passwordStrength.hasMinLength ? '✓' : '○'} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}>
                        {passwordStrength.hasUpperCase ? '✓' : '○'} 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                        {passwordStrength.hasNumber ? '✓' : '○'} 1 number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}>
                        {passwordStrength.hasSpecialChar ? '✓' : '○'} 1 special character (@$!%*?&)
                      </span>
                    </div>
                  </div>
                )}
              </div>

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
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-black font-semibold underline hover:no-underline"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-black font-semibold underline hover:no-underline"
                  >
                    Privacy Policy
                  </button>
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

      {/* Terms of Service Modal */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service">
        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-500 text-xs">Last updated: March 2026</p>

          <section>
            <h3 className="font-bold text-base text-black mb-2">1. Acceptance of Terms</h3>
            <p>By creating an account on VeloBike, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">2. Use of the Platform</h3>
            <p>VeloBike is a marketplace for buying and selling premium bicycles and cycling equipment. You agree to use the platform only for lawful purposes and in accordance with these terms. You must not:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Attempt to circumvent our escrow payment system</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the platform for any illegal activity</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">3. Account Responsibilities</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. VeloBike is not liable for any loss resulting from unauthorized use of your account.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">4. Listings and Transactions</h3>
            <p>Sellers are responsible for the accuracy of their listings, including descriptions, photos, and pricing. All transactions are subject to our verified inspection and escrow payment process to protect both buyers and sellers.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">5. Fees and Payments</h3>
            <p>VeloBike charges a service fee on completed transactions. Fees are clearly disclosed before any transaction is finalized. Payments are processed securely through our escrow system.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">6. Inspection Service</h3>
            <p>Our optional inspection service provides a professional assessment of bicycle condition. Inspection reports are provided in good faith but do not constitute a warranty or guarantee of the item's condition.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">7. Limitation of Liability</h3>
            <p>VeloBike acts as an intermediary marketplace and is not responsible for the quality, safety, or legality of items listed. Our liability is limited to the amount of fees paid to us in connection with the transaction in dispute.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">8. Termination</h3>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm the VeloBike community.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">9. Changes to Terms</h3>
            <p>VeloBike may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">10. Contact</h3>
            <p>For questions about these Terms of Service, contact us at <span className="font-semibold">support@velobike.com</span>.</p>
          </section>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-500 text-xs">Last updated: March 2026</p>

          <section>
            <h3 className="font-bold text-base text-black mb-2">1. Information We Collect</h3>
            <p>When you use VeloBike, we collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><span className="font-semibold">Account information:</span> name, email address, and password</li>
              <li><span className="font-semibold">Profile information:</span> profile photo, location, and contact details</li>
              <li><span className="font-semibold">Transaction data:</span> purchase history, listings, and payment information</li>
              <li><span className="font-semibold">Usage data:</span> pages visited, search queries, and interaction with listings</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">2. How We Use Your Information</h3>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide and improve our marketplace services</li>
              <li>Process transactions and send related notifications</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Send you updates about listings you follow or bids you place</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">3. Information Sharing</h3>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><span className="font-semibold">Other users:</span> limited profile information visible in transactions</li>
              <li><span className="font-semibold">Payment processors:</span> to complete secure transactions</li>
              <li><span className="font-semibold">Inspection partners:</span> when you request an inspection service</li>
              <li><span className="font-semibold">Legal authorities:</span> when required by law</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">4. Data Security</h3>
            <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">5. Cookies</h3>
            <p>VeloBike uses cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser, though disabling cookies may affect platform functionality.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">6. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access and review your personal data</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Data portability where applicable</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">7. Data Retention</h3>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. Transaction records may be retained for up to 7 years for legal and financial compliance purposes.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-black mb-2">8. Contact Us</h3>
            <p>For privacy-related questions or to exercise your rights, contact our Privacy Team at <span className="font-semibold">privacy@velobike.com</span>.</p>
          </section>
        </div>
      </Modal>
    </>
  );
};