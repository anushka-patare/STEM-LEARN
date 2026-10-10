import React, { useState } from 'react';

/**
 * Universal Avatar component for STEMLearn.
 * Displays photo with automatic fallback to high-contrast initials gradient avatar.
 */
export default function Avatar({
  src,
  name = 'User',
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className = '',
  role = 'student',
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-4xl',
  };

  const roleGradients = {
    admin: 'from-blue-600 to-indigo-700 text-white',
    teacher: 'from-emerald-500 to-teal-700 text-white',
    student: 'from-purple-600 to-indigo-600 text-white',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const gradient = roleGradients[role] || roleGradients.student;

  // Resolve photo URL with token support if relative
  let resolvedSrc = src;
  if (src && src.startsWith('/api/profile/photo/')) {
    const token = localStorage.getItem('token');
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    if (token) {
      resolvedSrc = `${apiBase}${src}?token=${encodeURIComponent(token)}`;
    } else {
      resolvedSrc = `${apiBase}${src}`;
    }
  }

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`${selectedSize} rounded-2xl object-cover border border-slate-200/80 shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`${selectedSize} rounded-2xl bg-gradient-to-tr ${gradient} font-bold flex items-center justify-center shadow-xs select-none ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
