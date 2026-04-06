export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({ name: '', agency_name: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/api/users/me');
        const u = data.data;
        setProfile({ name: u.name || '', agency_name: u.agency_name || '', bio: u.bio || '' });
        setAvatarUrl(u.avatar_url || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await api.put('/api/users/me', profile);
      setSaveMsg('Saved successfully');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      // Get presigned URL
      const { data } = await api.post('/api/users/me/avatar', {
        filename: file.name,
        contentType: file.type,
      });
      const { presignedUrl, fileUrl } = data.data;

      // Upload to S3
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setAvatarUrl(fileUrl);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/api/users/me', { data: { confirmation: 'DELETE' } });
      await logout();
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Avatar */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                {profile.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <label className="inline-block px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">
              {avatarUploading ? 'Uploading...' : 'Change Photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or WEBP. Max 5MB.</p>
          </div>
        </div>
      </section>

      {/* Profile info */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={user?.phone || ''}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-0.5">Phone number cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Your full name"
          />
        </div>

        {(user?.role === 'dealer' || user?.role === 'admin') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
              <input
                type="text"
                value={profile.agency_name}
                onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your agency or business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Tell buyers about yourself..."
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <section className="bg-white rounded-xl border border-red-200 p-5">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Deleting your account will deactivate all your listings and remove your personal data. This cannot be undone.
        </p>
        <button
          onClick={() => setDeleteModal(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
        >
          Delete Account
        </button>
      </section>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>DELETE</strong> below to confirm account deletion.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
