import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AdminPageLayoutProps {
  children: React.ReactNode;
}

export const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ children }) => (
  <div className="p-6 min-h-screen bg-slate-50/60">
    <div className="max-w-7xl mx-auto">{children}</div>
  </div>
);

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

interface AdminErrorBannerProps {
  message: string;
}

export const AdminErrorBanner: React.FC<AdminErrorBannerProps> = ({ message }) => (
  <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
    <AlertCircle className="h-5 w-5 shrink-0" />
    <span>{message}</span>
  </div>
);

interface AdminLoadingStateProps {
  message?: string;
}

export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
    <Loader2 className="h-10 w-10 animate-spin mb-3" />
    <p className="text-sm">{message}</p>
  </div>
);
