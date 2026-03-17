import React from 'react';

interface SellerPageLayoutProps {
  children: React.ReactNode;
}

export const SellerPageLayout: React.FC<SellerPageLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-slate-50/60 py-6 px-4">
    <div className="max-w-7xl mx-auto">{children}</div>
  </div>
);

interface SellerPageHeaderProps {
  title: string;
  subtitle?: string;
  rightSection?: React.ReactNode;
}

export const SellerPageHeader: React.FC<SellerPageHeaderProps> = ({
  title,
  subtitle,
  rightSection,
}) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {rightSection && <div className="flex items-center gap-3">{rightSection}</div>}
  </div>
);

