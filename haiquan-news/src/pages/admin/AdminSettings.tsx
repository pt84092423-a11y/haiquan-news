import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import React, { getAllSettings, upsertSetting, uploadImage } from '@/lib/supabase';

const SETTINGS_FIELDS = [
  { key: 'site_name', label: 'Tên website', type: 'text' },
  { key: 'site_description', label: 'Mô tả website', type: 'textarea' },
  { key: 'logo_url', label: 'URL Logo', type: 'text' },
  { key: 'og_default_image', label: 'OG Image mặc định', type: 'text' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'text' },
  { key: 'youtube_url', label: 'YouTube URL', type: 'text' },
  { key: 'zalo_url', label: 'Zalo URL', type: 'text' },
  { key: 'contact_email', label: 'Email liên hệ', type: 'email' },
  { key: 'contact_phone', label: 'Số điện thoại', type: 'text' },
  { key: 'contact_address', label: 'Địa chỉ', type: 'text' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [uploadingKey, setUploadingKey] = useState('');

  useEffect(() => {
    getAllSettings().then(setSettings);
  }, []);

  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSuccess('');
    try {
      const results = await Promise.all(
        Object.entries(settings).map(([k, v]) => upsertSetting(k, v))
      );
      const hasError = results.some((r: any) => r?.error);
      if (hasError) {
        setSaveError('Lưu thất bại, vui lòng thử lại.');
      } else {
        setSuccess('Đã lưu cài đặt thành công!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: any) {
      setSaveError('Lỗi: ' + (e?.message || 'Không thể lưu cài đặt'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (key: string, file?: File) => {
    if (!file) return;
    setUploadingKey(key);
    const url = await uploadImage(file);
    if (url) setSettings(s => ({ ...s, [key]: s[key] ? `${s[key]}\n${url}` : url }));
    setUploadingKey('');
  };

  return (
    <AdminLayout title="Cài đặt chung">
      <div className="mb-6">
        <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Cấu hình hệ thống</p>
        <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Cài đặt website</h2>
        <p className="text-[#6b7280] text-[14px] mt-1">Quản lý thông tin chung, logo, liên hệ và SEO mặc định. Ảnh quảng cáo đã được chuyển sang mục Quảng cáo riêng.</p>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px] font-semibold flex items-center gap-2"><span>✓</span> {success}</div>}
      {saveError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px] font-semibold flex items-center gap-2"><span>✗</span> {saveError}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {SETTINGS_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-[13px] font-bold text-[#555555] mb-1 uppercase">{field.label}</label>
            <div className="space-y-2">
              {field.upload && settings[field.key] && field.type !== 'textarea' && (
                <img src={settings[field.key]} alt="" className="max-h-40 rounded-lg border border-gray-100 object-contain bg-gray-50" />
              )}
              {field.type === 'textarea' ? (
                <textarea
                  value={settings[field.key] || ''}
                  onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full p-3 text-[14px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#0059b2]"
                  rows={4}
                />
              ) : (
                <input
                  type={field.type}
                  value={settings[field.key] || ''}
                  onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full p-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                />
              )}
              {field.upload && (
                <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(field.key, e.target.files?.[0])} />
                  {uploadingKey === field.key ? 'Đang tải ảnh ImgBB...' : 'Tải ảnh lên ImgBB'}
                </label>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#0059b2] text-white font-bold text-[14px] rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
