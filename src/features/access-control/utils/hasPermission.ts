import type { MyPermissionsDto } from '../types/access-control.types';
import { PATH_TO_PERMISSION_PATTERNS, ACCESS_CONTROL_ADMIN_ONLY_PATTERNS } from './permission-config';

const ADMIN_ROLE_TOKENS = ['admin', 'administrator', 'system admin', 'yonetici', 'yönetici', 'roles.admin'];

function normalizeAccessValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function isAdminLike(permissions: MyPermissionsDto | null | undefined): boolean {
  if (!permissions) return false;
  if (permissions.isSystemAdmin === true) return true;

  const normalizedRoleTitle = normalizeAccessValue(permissions.roleTitle);
  if (ADMIN_ROLE_TOKENS.some((token) => normalizedRoleTitle.includes(token))) {
    return true;
  }

  const permissionGroups = Array.isArray(permissions.permissionGroups) ? permissions.permissionGroups : [];
  return permissionGroups.some((groupName) => {
    const normalizedGroupName = normalizeAccessValue(groupName);
    return ADMIN_ROLE_TOKENS.some((token) => normalizedGroupName.includes(token));
  });
}

export function hasPermission(
  permissions: MyPermissionsDto | null | undefined,
  requiredCode: string
): boolean {
  if (!permissions) return false;
  if (isAdminLike(permissions)) return true;
  const permissionCodes = Array.isArray(permissions.permissionCodes) ? permissions.permissionCodes : [];
  if (permissionCodes.includes(requiredCode)) return true;

  const parts = requiredCode.split('.').filter(Boolean);
  const isViewLike = parts.length >= 3 && parts[parts.length - 1] === 'view';
  if (!isViewLike) return false;

  const moduleFallback = `${parts[0]}.view`;
  return permissionCodes.includes(moduleFallback);
}

export function resolveRequiredPermission(pathname: string): string | null {
  for (const { pattern, permission } of PATH_TO_PERMISSION_PATTERNS) {
    if (pattern.test(pathname)) {
      return permission;
    }
  }
  return null;
}

export function canAccessPath(
  permissions: MyPermissionsDto | null | undefined,
  pathname: string
): boolean {
  if (!permissions) return false;
  if (isAdminLike(permissions)) return true;
  if (ACCESS_CONTROL_ADMIN_ONLY_PATTERNS.some((p) => p.test(pathname))) {
    return isAdminLike(permissions);
  }
  const required = resolveRequiredPermission(pathname);
  if (!required) return true;
  return hasPermission(permissions, required);
}
