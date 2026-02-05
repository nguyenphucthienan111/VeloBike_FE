import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FacebookLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    FB?: {
      init: (config: any) => void;
      login: (callback: (response: any) => void, options: any) => void;
      api: (path: string, method: string, params: any, callback: (response: any) => void) => void;
      XFBML?: {
        parse: () => void;
      };
    };
    fbAsyncInit?: () => void;
  }
}

export const FacebookLogin: React.FC<FacebookLoginProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const FACEBOOK_APP_ID = (import.meta as any).env.VITE_FACEBOOK_APP_ID || '';

  React.useEffect(() => {
    if (!FACEBOOK_APP_ID) {
      console.error('Facebook App ID not configured');
      return;
    }

    // Check if FB is already loaded
    if (window.FB) {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        xfbml: false,
        version: 'v18.0',
      });
      return;
    }

    // Load Facebook SDK
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: FACEBOOK_APP_ID,
        xfbml: false,
        version: 'v18.0',
      });
      console.log('Facebook SDK initialized');
    };

    // Load Facebook script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0&appId=${FACEBOOK_APP_ID}&autoLogAppEvents=1`;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Facebook SDK script loaded');
    };
    
    script.onerror = () => {
      console.error('Failed to load Facebook SDK');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script, keep it for persistence
    };
  }, [FACEBOOK_APP_ID]);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      console.error('Facebook SDK not loaded');
      if (onError) onError('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);

    try {
      // Only request public_profile scope, not email
      window.FB.login((response: any) => {
        console.log('Facebook login response:', response);
        
        if (response.authResponse) {
          // Get user info (without email to avoid permission issues)
          window.FB!.api('/me', 'GET', { fields: 'id,name,picture' }, (userInfo: any) => {
            console.log('Facebook user info:', userInfo);
            
            // Use async function separately
            loginWithBackend(response.authResponse.accessToken, userInfo.id).finally(() => {
              setLoading(false);
            });
          });
        } else {
          setLoading(false);
          console.log('Facebook login cancelled or failed');
          if (onError) {
            onError('Facebook login cancelled');
          }
        }
      }, { scope: 'public_profile' }); // Only request public_profile scope
    } catch (error: any) {
      console.error('Facebook SDK error:', error);
      if (onError) {
        onError(error.message);
      }
      setLoading(false);
    }
  };

  const loginWithBackend = async (token: string, userId: string) => {
    try {
      // Send token to backend
      const res = await fetch(
        `${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/auth/facebook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            facebookToken: token,
            userID: userId,
          }),
        }
      );

      const data = await res.json();
      console.log('Backend response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Facebook login failed');
      }

      // Store tokens - ensure all are saved before redirect
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('user saved:', data.user);
      }

      // Dispatch event to notify Layout component
      window.dispatchEvent(new Event('authChange'));

      // Wait a bit to ensure localStorage is saved
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on role - use window.location for HashRouter
      const role = data.user?.role;
      console.log('Facebook login user role:', role, 'Redirecting...');
      
      let redirectPath = '/';
      if (role === 'SELLER') {
        redirectPath = '/seller/dashboard';
      } else if (role === 'BUYER') {
        redirectPath = '/buyer/dashboard';
      } else if (role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      } else if (role === 'INSPECTOR') {
        redirectPath = '/inspector/dashboard';
      }
      
      console.log('Redirecting to:', redirectPath);
      
      // Use window.location.href for HashRouter to ensure redirect works
      window.location.href = `#${redirectPath}`;

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      if (onError) {
        onError(error.message);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={loading}
      className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Đang đăng nhập...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </>
      )}
    </button>
  );
};

export default FacebookLogin;
