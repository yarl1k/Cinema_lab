import { ref, computed, watch } from 'vue';
import { authClient } from '@/lib/auth-client';

const session = authClient.useSession();
const overrideRole = ref<string | null>(localStorage.getItem('preview_role'));

watch(overrideRole, (newRole) => {
  if (newRole) {
    localStorage.setItem('preview_role', newRole);
  } else {
    localStorage.removeItem('preview_role');
  }
});

const ROLE_HIERARCHY: Record<string, number> = { user: 1, manager: 2, admin: 3, superadmin: 4 };

export const useActiveRole = () => {
  const actualRole = computed(() => {
    return (session.value?.data?.user as any)?.role || 'user';
  });

  const activeRole = computed(() => {
    if (overrideRole.value && ['user', 'manager', 'admin', 'superadmin'].includes(overrideRole.value)) {
      // Don't let users elevate themselves via preview, only lower
      const actualLevel = ROLE_HIERARCHY[actualRole.value] || 1;
      const requestedLevel = ROLE_HIERARCHY[overrideRole.value] || 1;
      if (requestedLevel <= actualLevel) {
        return overrideRole.value;
      }
    }
    return actualRole.value;
  });

  const setPreviewRole = (role: string | null) => {
    overrideRole.value = role;
  };

  const isSuperadmin = computed(() => activeRole.value === 'superadmin');
  const isAdminOrHigher = computed(() => ['admin', 'superadmin'].includes(activeRole.value));
  const isManagerOrHigher = computed(() => ['manager', 'admin', 'superadmin'].includes(activeRole.value));

  const roleLabel = computed(() => {
    const r = activeRole.value;
    if (r === 'superadmin') return 'Суперадмін';
    if (r === 'admin') return 'Адміністратор';
    if (r === 'manager') return 'Менеджер';
    return 'Користувач';
  });

  const availableRoles = computed(() => {
    const roles = [{ value: 'user', label: 'Користувач' }];
    const level = ROLE_HIERARCHY[actualRole.value] || 1;
    if (level >= 2) roles.unshift({ value: 'manager', label: 'Менеджер' });
    if (level >= 3) roles.unshift({ value: 'admin', label: 'Адміністратор' });
    if (level >= 4) roles.unshift({ value: 'superadmin', label: 'Суперадмін' });
    return roles;
  });

  return {
    actualRole,
    activeRole,
    isSuperadmin,
    isAdminOrHigher,
    isManagerOrHigher,
    roleLabel,
    availableRoles,
    setPreviewRole
  };
};
