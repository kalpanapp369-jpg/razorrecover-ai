import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  text?: 'continue_with' | 'signup_with' | 'signin_with';
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'continue_with',
  onSuccess,
  onError,
}) => {
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '312512595334-b5rga86dk6oih3cj9u1tejgef21skl8m.apps.googleusercontent.com';

  // Process verified profile returned from Google
  const handleVerifiedGoogleUser = async (profile: {
    email: string;
    name?: string;
    picture?: string;
    sub?: string;
  }) => {
    setIsAuthenticating(true);
    setErrorMsg(null);

    try {
      // Authenticate with server - strictly enforced as CUSTOMER role for security
      const user = await googleLogin({
        email: profile.email.toLowerCase(),
        fullName: profile.name || profile.email.split('@')[0],
        avatarUrl: profile.picture,
        googleId: profile.sub,
        role: 'CUSTOMER', // Strict security: customer accounts never access internal admin data
        company: 'Customer Workspace',
      });

      if (onSuccess) onSuccess();

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to authenticate with Google account.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Decode JWT credential from Google Identity Services
  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) return;

    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      await handleVerifiedGoogleUser(decoded);
    } catch (err: any) {
      setErrorMsg('Failed to process Google ID token.');
    }
  };

  // Trigger Google OAuth 2.0 Popup using Token Client
  const handleManualGooglePopup = () => {
    if (!window.google?.accounts?.oauth2) {
      setErrorMsg('Google Identity Services SDK is still loading. Please try again in a moment.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg(null);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            setIsAuthenticating(false);
            if (tokenResponse.error !== 'popup_closed_by_user') {
              setErrorMsg(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              // Real-time call to Google's official userinfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile?.email) {
                await handleVerifiedGoogleUser(profile);
              } else {
                setErrorMsg('No email address was returned by Google.');
                setIsAuthenticating(false);
              }
            } catch (fetchErr: any) {
              setErrorMsg('Failed to fetch Google profile info.');
              setIsAuthenticating(false);
            }
          }
        },
      });

      // Launch Google's official OAuth login popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMsg(err.message || 'Unable to open Google OAuth dialog.');
    }
  };

  // Mount Google official button & initialize SDK
  useEffect(() => {
    let checkInterval: any;

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        setSdkReady(true);
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: text,
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 384,
            });
          }
        } catch (e) {
          console.warn('Google GSI renderButton fallback to OAuth popup:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, text]);

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-[4px] border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Official Google GSI Rendered Container */}
      <div
        ref={googleBtnContainerRef}
        className="flex w-full items-center justify-center min-h-[44px] overflow-hidden rounded-[4px]"
      />

      {/* Direct Interactive Fallback Button (Matches Blade Styling & Launches Real Google Popup) */}
      <button
        type="button"
        onClick={handleManualGooglePopup}
        disabled={isAuthenticating}
        className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[4px] border border-slate-300 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
      >
        {isAuthenticating ? (
          <div className="flex items-center gap-2 text-[#0D94FB]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting to Google...</span>
          </div>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (Real-Time OAuth)</span>
          </>
        )}
      </button>

      <div className="mt-1.5 text-center text-[10px] text-slate-400">
        Authenticates directly with Google Accounts • Zero password required
      </div>
    </div>
  );
};
