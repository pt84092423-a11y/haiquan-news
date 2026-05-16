import React, { useState } from 'react';
import UserProfileModal from './UserProfileModal';

interface AuthorAvatarProps {
  authorId?: number;
  authorName?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  align?: 'left' | 'right';
}

const PALETTE = ['bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-teal-600', 'bg-orange-600', 'bg-rose-600'];

export default function AuthorAvatar({
  authorId,
  authorName,
  avatarUrl,
  size = 'md',
  showName = true,
  align = 'right',
}: AuthorAvatarProps) {
  const [showModal, setShowModal] = useState(false);

  const name = authorName || 'Ban biên tập';
  const initial = name.charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % PALETTE.length;
  const bg = PALETTE[colorIndex];

  const sizeCls = {
    sm: 'w-7 h-7 text-[12px]',
    md: 'w-9 h-9 text-[14px]',
    lg: 'w-12 h-12 text-[18px]',
  }[size];

  const canClick = !!authorId;

  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${sizeCls} rounded-full object-cover border-2 border-white shadow ring-1 ring-gray-200`} />
  ) : (
    <div className={`${sizeCls} rounded-full ${bg} flex items-center justify-center text-white font-black border-2 border-white shadow ring-1 ring-gray-200 flex-shrink-0`}>
      {initial}
    </div>
  );

  const content = (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {align === 'right' && showName && (
        <span className={`font-bold text-[14px] text-[#222] ${canClick ? 'group-hover:text-[#0059b2] transition' : ''}`}>{name}</span>
      )}
      {avatar}
      {align === 'left' && showName && (
        <span className={`font-bold text-[14px] text-[#222] ${canClick ? 'group-hover:text-[#0059b2] transition' : ''}`}>{name}</span>
      )}
    </div>
  );

  if (!canClick) return <div className="mt-6 mb-8">{content}</div>;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group mt-6 mb-8 w-full text-right cursor-pointer"
        title="Xem thông tin tác giả"
      >
        {content}
      </button>

      {showModal && (
        <UserProfileModal
          userId={authorId}
          authorName={authorName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
