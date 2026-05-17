import {  useEffect, useState  } from 'react';
import AdminLayout from './AdminLayout';
import {  getAllSettings, upsertSetting, uploadImage  } from '@/lib/supabase';

const AD_FIELDS = [
  { key: 'home_ad_main_images', label: 'Poster trang chủ 1 - nhiều ảnh tự đổi (mỗi dòng 1 URL)', type: 'textarea', upload: true },
  { key: 'home_ad_main_link', label: 'Link quảng cáo ngang trang chủ', type: 'text', upload: true },
  { key: 'home_ad_sidebar_image', label: 'Ảnh quảng cáo cột phải trang chủ', type: 'text', upload: true },
  { key: 'home_ad_sidebar_link', label: 'Link quảng cáo cột phải trang chủ', type: 'text', upload: true },
  { key: 'home_ad_media_image', label: 'Ảnh quảng cáo mục Hải Quân Media', type: 'text', upload: true },
  { key: 'home_ad_media_link', label: 'Link quảng cáo mục Hải Quân Media', type: 'text', upload: true },
  { key: 'home_ad_bottom_images', label: 'Poster trang chủ 2 - nhiều ảnh tự đổi (mỗi dòng 1 URL)', type: 'textarea', upload: true },
  { key: 'home_ad_bottom_link', label: 'Link quảng cáo cuối trang chủ', type: 'text', upload: true },
  { key: 'article_ad_1_image', label: 'Ảnh quảng cáo bài viết/chuyên mục 1', type: 'text', upload: true },
  { key: 'article_ad_1_link', label: 'Link quảng cáo bài viết/chuyên mục 1', type: 'text', upload: true },
  { key: 'article_ad_2_image', label: 'Ảnh quảng cáo bài viết/chuyên mục 2', type: 'text', upload: true },
  { key: 'article_ad_2_link', label: 'Link quảng cáo bài viết/chuyên mục 2', type: 'text', upload: true },
];

export default function AdminAds() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [uploadingKey, setUploadingKey] = useState('');

  useEffect(() => {
    getAllSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSuccess('');
    try {
      const results = await Promise.all(AD_FIELDS.map(field => upsertSetting(field.key, settings[field.key] || '')));
      const hasError = results.some((r: any) => r?.error);
      if (hasError) setSaveError('Lưu thất bại, vui lòng thử lại.');
      else {
        setSuccess('Đã lưu quảng cáo thành công!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: any) {
      setSaveError('Lỗi: ' + (e?.message || 'Không thể lưu quảng cáo'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (key: string, type: string, file?: File) => {
    if (!file) return;
    setUploadingKey(key);
    const url = await uploadImage(file);
    if (url) setSettings(s => ({ ...s, [key]: type === 'textarea' && s[key] ? `${s[key]}\n${url}` : url }));
    setUploadingKey('');
  };

  return (
    <AdminLayout title="Quảng cáo">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Quản trị hiển thị</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Ảnh quảng cáo</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Tách riêng toàn bộ poster, banner và quảng cáo khỏi phần cài đặt chung.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[#0059b2] text-white font-bold text-[14px] rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow">{saving ? 'Đang lưu...' : 'Lưu quảng cáo'}</button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px] font-semibold">{success}</div>}
      {saveError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px] font-semibold">{saveError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {AD_FIELDS.map(field => (
          <section key={field.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <label className="block text-[13px] font-bold text-[#374151] uppercase">{field.label}</label>
            {settings[field.key] && /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(settings[field.key]) && <img src={settings[field.key]} alt="" className="max-h-48 rounded-lg border border-gray-100 object-contain bg-gray-50" />}
            {field.type === 'textarea' ? (
              <textarea value={settings[field.key] || ''} onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))} className="w-full p-3 text-[14px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#0059b2]" rows={5} />
            ) : (
              <input type="text" value={settings[field.key] || ''} onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))} className="w-full p-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" />
            )}
            {field.upload && (
              <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(field.key, field.type, e.target.files?.[0])} />
                {uploadingKey === field.key ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
              </label>
            )}
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
