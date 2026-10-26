import React from 'react';

/**
 * Reusable Avatar & AvatarGroup Components
 */
export function Avatar({
  name = 'User',
  initials = null,
  size = 'md',
  status = null, // 'online' | 'offline' | 'busy'
  className = '',
}) {
  const userInitials = initials || (name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U');

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-12 h-12 text-base font-semibold',
  };

  // Consistent background color based on name string hash
  const colors = [
    'bg-indigo-600 text-white',
    'bg-emerald-600 text-white',
    'bg-sky-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeStyles[size] || sizeStyles.md} ${colorClass} rounded-full flex items-center justify-center font-medium shadow-sm select-none`}
        title={name}
      >
        {userInitials}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block w-2 h-2 rounded-full ring-2 ring-white ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visibleUsers.map((user, idx) => {
        const name = typeof user === 'string' ? user : user.name || 'User';
        const initials = typeof user === 'string' ? user : user.avatar || null;
        return (
          <Avatar
            key={idx}
            name={name}
            initials={initials}
            size={size}
            className="ring-2 ring-white rounded-full"
          />
        );
      })}
      {remainingCount > 0 && (
        <div
          className={`rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center ring-2 ring-white text-[10px] w-7 h-7`}
          title={`${remainingCount} more members`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export default Avatar;
