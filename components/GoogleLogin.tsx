import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';

interface GoogleLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const showToast = (type: 'success' | 'error' | 'info', message: string) => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { type, message } }));
};

export const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const firebaseIdToken = await signInWithGoogle();

      const res = await fetch(
        `${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseToken: firebaseIdToken }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Google login failed');

      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('authChange'));
      showToast('success', 'Welcome! Signed in with Google successfully.');

      const role = data.user?.role;
      const from = (location.state as any)?.from;
      if (from && typeof from === 'string') {
        navigate(from, { replace: true });
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'INSPECTOR') {
        navigate('/inspector/dashboard');
      } else {
        navigate('/marketplace');
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      // User closed the popup — don't show error
      if (error?.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      showToast('error', error.message || 'Google sign-in failed');
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="text-gray-500">Signing in...</span>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
};

export default GoogleLogin;
