'use client';

import { Video } from '@/types';

interface UserInfoProps {
  video: Video;
  onUsernameClick: (userId: string) => void;
}

export function UserInfo({ video, onUsernameClick }: UserInfoProps) {
  return (
    <div className="text-white">
      {/* Username */}
      <button
        onClick={() => onUsernameClick(video.userId)}
        className="font-semibold text-base hover:underline"
      >
        @{video.username}
      </button>

      {/* Description/Prompt */}
      {video.description && (
        <p className="text-sm mt-1 line-clamp-2 opacity-90">
          {video.description}
        </p>
      )}

      {/* Model badge */}
      {video.modelUsed && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">
          <span className="opacity-70">Made with</span>
          <span className="font-medium">{video.modelUsed}</span>
        </div>
      )}
    </div>
  );
}
