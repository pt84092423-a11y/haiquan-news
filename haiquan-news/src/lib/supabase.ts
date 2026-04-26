import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gqxrptccptfbzfdmaoyl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  created_at?: string;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  thumbnail?: string;
  category_id?: number;
  category?: Category;
  status: 'draft' | 'published';
  view_count: number;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  post_type: 'article' | 'video' | 'podcast' | 'longform' | 'photo_story' | 'baoin';
  video_url?: string;
  audio_url?: string;
  author?: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
};

export type OgPayload = {
  title?: string;
  image?: string;
  gallery?: string[];
};

export type SiteSetting = {
  key: string;
  value: string;
};

export async function getPublishedPosts(options?: {
  categorySlug?: string;
  postType?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('posts')
    .select('*, category:categories(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (options?.postType) {
    query = query.eq('post_type', options.postType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
  }

  const { data, error } = await query;
  if (error) console.error('Error fetching posts:', error);
  return data as Post[] | null;
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) return null;
  return data as Post | null;
}

export async function incrementViewCount(postId: number) {
  await supabase.rpc('increment_view_count', { post_id: postId });
}

export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) return [];
  return data as Category[];
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as Category | null;
}

export async function getSiteSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? null;
}

export function parseJsonSetting<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function packOgPayload(payload: OgPayload): string {
  const clean: OgPayload = {};
  if (payload.title?.trim()) clean.title = payload.title.trim();
  if (payload.image?.trim()) clean.image = payload.image.trim();
  if (payload.gallery?.length) clean.gallery = payload.gallery;
  return `[OG:${JSON.stringify(clean)}]`;
}

export function parseOgPayload(value?: string | null): OgPayload {
  if (!value) return {};
  if (value.startsWith('[OG:')) {
    try {
      return JSON.parse(value.replace('[OG:', '').replace(/\]$/, '')) as OgPayload;
    } catch {
      return {};
    }
  }
  if (value.startsWith('[GALLERY:')) {
    try {
      return { gallery: JSON.parse(value.replace('[GALLERY:', '').replace(/\]$/, '')) };
    } catch {
      return {};
    }
  }
  return { image: value };
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from('settings').select('*');
  if (!data) return {};
  return Object.fromEntries(data.map((s: SiteSetting) => [s.key, s.value]));
}

export async function upsertSetting(key: string, value: string) {
  return supabase.from('settings').upsert({ key, value });
}

export async function getAllPosts(options?: { limit?: number; offset?: number; status?: string }) {
  let query = supabase
    .from('posts')
    .select('*, category:categories(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 20)) - 1);
  }

  const { data, error, count } = await query;
  if (error) return { posts: [], count: 0 };
  return { posts: data as Post[], count: count ?? 0 };
}

export async function createPost(post: Partial<Post>) {
  const { data, error } = await supabase.from('posts').insert(post).select().single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: number, updates: Partial<Post>) {
  const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: number) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function createCategory(cat: Partial<Category>) {
  const { data, error } = await supabase.from('categories').insert(cat).select().single();
  if (error) throw error;
  return data as Category;
}

const IMGBB_API_KEY = '03971349653b2f4431b2b3f9e6c3d8d8';

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('WebP conversion failed'));
      }, 'image/webp', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const webpBlob = await convertToWebP(file);
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(webpBlob);
    });
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    formData.append('name', file.name.replace(/\.[^.]+$/, '') || `haiquan-${Date.now()}`);
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (json.success && json.data?.url) {
      return json.data.url as string;
    }
    console.error('imgbb upload failed:', json);
    return null;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

export async function uploadMediaFile(
  file: File,
  folder: 'audio' | 'pdf' | 'video'
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() || '';
    const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('haiquan-media')
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Storage upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('haiquan-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('uploadMediaFile error:', err);
    return null;
  }
}

export function generateSlug(title: string): string {
  const vietnamese: Record<string, string> = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ắ':'a','ặ':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'â':'a','è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i','ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o',
    'ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o','ù':'u','ú':'u',
    'ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u','ỳ':'y','ý':'y','ỷ':'y',
    'ỹ':'y','ỵ':'y','đ':'d','À':'a','Á':'a','Ả':'a','Ã':'a','Ạ':'a','Ă':'a','Ắ':'a','Ặ':'a','Ầ':'a',
    'Ấ':'a','Ẩ':'a','Ẫ':'a','Ậ':'a','Â':'a','È':'e','É':'e','Ẻ':'e','Ẽ':'e','Ẹ':'e','Ê':'e','Ề':'e',
    'Ế':'e','Ể':'e','Ễ':'e','Ệ':'e','Ì':'i','Í':'i','Ỉ':'i','Ĩ':'i','Ị':'i','Ò':'o','Ó':'o','Ỏ':'o',
    'Õ':'o','Ọ':'o','Ô':'o','Ồ':'o','Ố':'o','Ổ':'o','Ỗ':'o','Ộ':'o','Ơ':'o','Ờ':'o','Ớ':'o','Ở':'o',
    'Ỡ':'o','Ợ':'o','Ù':'u','Ú':'u','Ủ':'u','Ũ':'u','Ụ':'u','Ư':'u','Ừ':'u','Ứ':'u','Ử':'u','Ữ':'u',
    'Ự':'u','Ỳ':'y','Ý':'y','Ỷ':'y','Ỹ':'y','Ỵ':'y','Đ':'d'
  };
  return title
    .split('')
    .map(c => vietnamese[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SQL_SCHEMA = `
-- Bảng Categories (Danh mục đa cấp)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Posts (Bài viết)
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  thumbnail TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  view_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  post_type VARCHAR(50) DEFAULT 'article' CHECK (post_type IN ('article','video','podcast','longform','photo_story','baoin')),
  video_url TEXT,
  audio_url TEXT,
  author VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Bảng Settings (Cấu hình website)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

-- Function để tự động tăng view_count
CREATE OR REPLACE FUNCTION increment_view_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

-- Insert dữ liệu mẫu categories
INSERT INTO categories (name, slug, description) VALUES
  ('Tin tức', 'tin-tuc', 'Tin tức thời sự'),
  ('Vì chủ quyền biển đảo', 'vi-chu-quyen', 'Bảo vệ chủ quyền biển đảo Tổ quốc'),
  ('Tâm tình lính biển', 'tam-tinh', 'Câu chuyện người lính biển'),
  ('Lịch sử', 'lich-su', 'Lịch sử Hải quân Nhân dân Việt Nam'),
  ('Longform', 'longform', 'Bài viết chuyên sâu dạng dài'),
  ('Phóng sự ảnh', 'phong-su-anh', 'Phóng sự bằng hình ảnh'),
  ('Truyền hình Hải quân', 'truyen-hinh-hq', 'Video truyền hình'),
  ('Cấu trúc', 'cau-truc', 'Cấu trúc tổ chức Hải quân'),
  ('Chỉ huy', 'chi-huy', 'Thông tin chỉ huy Hải quân'),
  ('Podcast', 'podcast', 'Chương trình âm thanh'),
  ('Báo In', 'bao-in', 'Phiên bản báo in số hóa')
ON CONFLICT (slug) DO NOTHING;

-- Insert cài đặt website mặc định
INSERT INTO settings (key, value) VALUES
  ('site_name', 'Báo Hải Quân Việt Nam - SROV'),
  ('site_description', 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam'),
  ('logo_url', 'https://media.discordapp.net/attachments/882932839153299486/1486310006247788595/Copy_of_Bao_Hai_Quan_ND.png?ex=69c5098f&is=69c3b80f&hm=86a45653b0c39f0abf41bf21a3fabd5412a20880a1517a9ee8054fa437d710e8&=&format=webp&quality=lossless&width=619&height=203'),
  ('facebook_url', '#'),
  ('youtube_url', '#'),
  ('zalo_url', '#'),
  ('contact_email', 'pt84092423@gmail.com'),
  ('contact_phone', '024.XXXX.XXXX'),
  ('contact_address', 'Số XX đường XX, Hà Nội'),
  ('og_default_image', 'https://media.discordapp.net/attachments/882932839153299486/1486310006247788595/Copy_of_Bao_Hai_Quan_ND.png?ex=69c5098f&is=69c3b80f&hm=86a45653b0c39f0abf41bf21a3fabd5412a20880a1517a9ee8054fa437d710e8&=&format=webp&quality=lossless&width=619&height=203'),
  ('home_ad_main_image', 'https://baohaiquanvietnam.vn/storage/users/user_12/2025/TH%C3%81NG%2011/14/z7226029114068_f556938a4a781dddde927265a1a30a65.jpg'),
  ('home_ad_main_link', '#'),
  ('home_ad_sidebar_image', '/quangcao-101.png'),
  ('home_ad_sidebar_link', '#'),
  ('home_ad_media_image', '/quangcao-101.png'),
  ('home_ad_media_link', '#'),
  ('home_ad_bottom_image', 'https://baohaiquanvietnam.vn/storage/users/user_12/2026/Banner/126.png'),
  ('home_ad_bottom_link', '#'),
  ('article_ad_1_image', '/quangcao-101.png'),
  ('article_ad_1_link', '#'),
  ('article_ad_2_image', '/quangcao-954.png'),
  ('article_ad_2_link', '#')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read published posts" ON posts FOR SELECT USING (status = 'published' OR true);
CREATE POLICY "Allow anon read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow anon read settings" ON settings FOR SELECT USING (true);

-- Admin write policies (allow all for anon - MVP without auth)
CREATE POLICY "Allow anon insert posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete posts" ON posts FOR DELETE USING (true);
CREATE POLICY "Allow anon insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete categories" ON categories FOR DELETE USING (true);
CREATE POLICY "Allow anon insert settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update settings" ON settings FOR UPDATE USING (true);

-- Storage bucket for media files (PDF, audio, video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'haiquan-media',
  'haiquan-media',
  true,
  209715200,
  ARRAY['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/x-m4a','video/mp4','video/webm','video/ogg','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Allow anon upload to haiquan-media bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='haiquan_media_upload') THEN
    EXECUTE 'CREATE POLICY "haiquan_media_upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = ''haiquan-media'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='haiquan_media_read') THEN
    EXECUTE 'CREATE POLICY "haiquan_media_read" ON storage.objects FOR SELECT TO anon USING (bucket_id = ''haiquan-media'')';
  END IF;
END $$;
`;
