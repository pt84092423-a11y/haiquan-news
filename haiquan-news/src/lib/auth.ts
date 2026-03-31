import { supabase } from './supabase';

export type UserRole = 'HADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: number;
  username: string;
  role: UserRole;
  display_name?: string;
}

const SESSION_KEY = 'hqvn_admin_session';

export function getSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setSession(user: AdminUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username: string, password: string): Promise<AdminUser | null> {
  const hash = await simpleHash(password);
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', hash)
    .eq('status', 'active')
    .single();
  if (error || !data) return null;
  const user: AdminUser = {
    id: data.id,
    username: data.username,
    role: data.role as UserRole,
    display_name: data.display_name,
  };
  setSession(user);
  await addAuditLog('LOGIN', 'session', null, `Đăng nhập thành công`, user);
  return user;
}

export async function logout(user: AdminUser | null) {
  if (user) {
    await addAuditLog('LOGOUT', 'session', null, `Đăng xuất`, user);
  }
  clearSession();
}

export async function addAuditLog(
  action: string,
  targetType: string,
  targetId: number | null,
  detail: string,
  actor?: AdminUser | null
) {
  const session = actor || getSession();
  if (!session) return;
  await supabase.from('audit_logs').insert({
    actor_id: session.id,
    actor_username: session.username,
    actor_role: session.role,
    action,
    target_type: targetType,
    target_id: targetId,
    detail,
  });
}

export function can(role: UserRole | undefined, action: string): boolean {
  if (!role) return false;
  const perms: Record<string, UserRole[]> = {
    write_post: ['HADMIN', 'ADMIN', 'EDITOR'],
    edit_post: ['HADMIN', 'ADMIN', 'EDITOR'],
    delete_post: ['HADMIN', 'ADMIN', 'EDITOR'],
    publish_post: ['HADMIN', 'ADMIN'],
    approve_tamtinh: ['HADMIN', 'ADMIN', 'EDITOR'],
    create_account: ['HADMIN', 'ADMIN'],
    delete_account: ['HADMIN'],
    view_audit_log: ['HADMIN', 'ADMIN'],
    manage_users: ['HADMIN', 'ADMIN'],
    approve_requests: ['HADMIN', 'ADMIN'],
  };
  return (perms[action] || []).includes(role);
}

export function needsApproval(role: UserRole | undefined, action: string): boolean {
  if (!role) return true;
  const needsApproval: Record<string, UserRole[]> = {
    publish_post: ['EDITOR'],
    delete_post: ['EDITOR'],
    delete_account: ['ADMIN'],
  };
  return (needsApproval[action] || []).includes(role);
}

export async function getAdminUsers() {
  const { data } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createAdminUser(
  username: string,
  password: string,
  role: UserRole,
  displayName: string,
  actor: AdminUser
) {
  const hash = await simpleHash(password);
  const { data, error } = await supabase.from('admin_users').insert({
    username,
    password_hash: hash,
    role,
    display_name: displayName,
    created_by: actor.username,
    status: 'active',
  }).select().single();
  if (error) throw error;
  await addAuditLog('CREATE_USER', 'admin_user', data.id, `Tạo tài khoản ${username} (${role})`, actor);
  return data;
}

export async function deleteAdminUser(userId: number, username: string, actor: AdminUser) {
  const { error } = await supabase.from('admin_users').update({ status: 'inactive' }).eq('id', userId);
  if (error) throw error;
  await addAuditLog('DELETE_USER', 'admin_user', userId, `Vô hiệu hóa tài khoản ${username}`, actor);
}

export async function createApprovalRequest(
  type: string,
  targetId: number | null,
  targetInfo: string,
  actor: AdminUser
) {
  const { data, error } = await supabase.from('approval_requests').insert({
    type,
    target_id: targetId,
    target_info: targetInfo,
    requested_by: actor.id,
    requested_by_username: actor.username,
    status: 'pending',
  }).select().single();
  if (error) throw error;
  await addAuditLog('REQUEST_' + type, 'approval_request', data.id, targetInfo, actor);
  return data;
}

export async function getApprovalRequests(status?: string) {
  let q = supabase.from('approval_requests').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data } = await q;
  return data || [];
}

export async function reviewApprovalRequest(
  requestId: number,
  approved: boolean,
  actor: AdminUser
) {
  const { error } = await supabase.from('approval_requests').update({
    status: approved ? 'approved' : 'rejected',
    reviewed_by: actor.id,
    reviewed_by_username: actor.username,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId);
  if (error) throw error;
  await addAuditLog(
    approved ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
    'approval_request',
    requestId,
    `${approved ? 'Duyệt' : 'Từ chối'} yêu cầu #${requestId}`,
    actor
  );
}

export async function getAuditLogs(limit = 100) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export const ADMIN_SQL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('HADMIN','ADMIN','EDITOR')),
  display_name VARCHAR(200),
  created_by VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER,
  actor_username VARCHAR(100),
  actor_role VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  target_id INTEGER,
  target_info TEXT,
  requested_by INTEGER,
  requested_by_username VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by INTEGER,
  reviewed_by_username VARCHAR(100),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tài khoản HADMIN mặc định (username: TP67, password: HaiQuan@2025!)
-- Đổi mật khẩu ngay sau khi đăng nhập lần đầu!
INSERT INTO admin_users (username, password_hash, role, display_name, created_by, status)
VALUES ('TP67', 'be832440cb3d665d503b1120438271c00f35bbfb4571e63d0a8b96db257599aa', 'HADMIN', 'Trưởng ban biên tập', 'system', 'active')
ON CONFLICT (username) DO NOTHING;
`;
