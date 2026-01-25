import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          revoke: (accessToken: string, callback: (done: boolean) => void) => void;
        };
      };
    };
  }
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    console.log('Google response received:', response);

    try {
      // Send token to backend
      const res = await fetch(
        `${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleToken: response.credential,
          }),
        }
      );

      const data = await res.json();
      console.log('Backend response:', data, 'Status:', res.status);

      if (!res.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        console.log('accessToken saved');
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
        console.log('refreshToken saved');
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('user saved');
      }

      // Dispatch event to notify Layout component
      window.dispatchEvent(new Event('authStatusChanged'));
      console.log('authStatusChanged event dispatched');

      // Redirect to home
      console.log('Navigating to home in 500ms');
      setTimeout(() => {
        console.log('Navigating to /');
        navigate('/');
      }, 500);
    } catch (error: any) {
      console.error('Google login error:', error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID not configured');
      return;
    }

    // Load Google SDK script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [GOOGLE_CLIENT_ID]);

  const renderGoogleButton = (element: HTMLElement) => {
    if (window.google && element) {
      // Clear previous renders
      element.innerHTML = '';
      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
      });
    }
  };

  React.useEffect(() => {
    // Render button when Google SDK is ready
    const checkAndRender = setInterval(() => {
      if (window.google) {
        const container = document.getElementById('google-login-button');
        if (container) {
          renderGoogleButton(container);
          clearInterval(checkAndRender);
        }
      }
    }, 100);

    return () => clearInterval(checkAndRender);
  }, []);

  return (
    <div
      id="google-login-button"
      className="w-full"
    >
      {loading && (
        <div className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-center text-gray-600">
          Đang đăng nhập với Google...
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;
