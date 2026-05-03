export type MediaPlatform = 'youtube' | 'tiktok' | 'zingmp3' | 'soundcloud' | 'vimeo' | 'facebook' | 'direct' | 'unknown';

export function detectPlatform(url: string): MediaPlatform {
  if (!url) return 'unknown';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
  if (u.includes('zingmp3.vn')) return 'zingmp3';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (url.match(/\.(mp4|webm|ogg|mp3|wav)(\?|$)/i)) return 'direct';
  return 'unknown';
}

export function toEmbedUrl(url: string): string {
  const platform = detectPlatform(url);
  switch (platform) {
    case 'youtube': {
      const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
      return url;
    }
    case 'tiktok': {
      const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
      if (url.includes('/embed/v2/')) return url;
      return url;
    }
    case 'soundcloud': {
      if (url.includes('w.soundcloud.com/player')) return url;
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%230059b2&auto_play=false&hide_related=false&show_comments=false&show_user=true&visual=true`;
    }
    case 'zingmp3': {
      return url;
    }
    case 'vimeo': {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
      return url;
    }
    case 'facebook': {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    }
    default:
      return url;
  }
}

export function isShortFormat(url: string): boolean {
  const platform = detectPlatform(url);
  return platform === 'tiktok' || url.includes('/shorts/');
}

export function isAudioPlatform(url: string): boolean {
  const p = detectPlatform(url);
  return p === 'zingmp3' || p === 'soundcloud';
}

export const PLATFORM_META: Record<MediaPlatform, { name: string; color: string; bg: string; textColor: string }> = {
  youtube:    { name: 'YouTube',         color: '#FF0000', bg: '#FFF0F0', textColor: '#cc0000' },
  tiktok:     { name: 'TikTok',          color: '#010101', bg: '#f0f0f0', textColor: '#333333' },
  zingmp3:    { name: 'ZingMP3',         color: '#4A90E2', bg: '#EEF4FF', textColor: '#2d6abf' },
  soundcloud: { name: 'SoundCloud',      color: '#FF5500', bg: '#FFF3EE', textColor: '#cc4400' },
  vimeo:      { name: 'Vimeo',           color: '#1AB7EA', bg: '#EEF9FF', textColor: '#0d8fb5' },
  facebook:   { name: 'Facebook Video',  color: '#1877F2', bg: '#EEF4FF', textColor: '#0d5cb8' },
  direct:     { name: 'Tệp trực tiếp',   color: '#666666', bg: '#F5F5F5', textColor: '#444444' },
  unknown:    { name: 'Liên kết',        color: '#999999', bg: '#F5F5F5', textColor: '#666666' },
};
