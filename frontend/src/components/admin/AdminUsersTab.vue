<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/apiQueries';
import AppAdminTable from '@/components/AppAdminTable.vue';
import type { User } from '@/types/types';
import { useActiveRole } from '@/composables/useActiveRole';

const users = ref<User[]>([]);
const { actualRole } = useActiveRole();

const ROLE_HIERARCHY: Record<string, number> = { user: 1, manager: 2, admin: 3, superadmin: 4 };
const getLevel = (role?: string | null) => ROLE_HIERARCHY[role || 'user'] || 1;

const ROLE_LABELS = {
    user: 'Користувач',
    manager: 'Менеджер',
    admin: 'Адміністратор',
    superadmin: 'Суперадмін'
};

onMounted(async () => {
    await fetchUsers();
});

const fetchUsers = async () => {
    try {
        users.value = await api.getUsers();
    } catch (e: any) {
        alert(e.message);
    }
};

const handleRoleChange = async (user: User, event: Event) => {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value;
    const oldRole = user.role;

    if (newRole === oldRole) return;
    
    const myLevel = getLevel(actualRole.value);
    const newLevel = getLevel(newRole);
    
    let adminCode = '';
    // Request admin code if elevating to a highly privileged level (>= 3)
    if (newLevel >= 3) {
        adminCode = prompt(`Введіть секретний код адміністратора для призначення ролі "${ROLE_LABELS[newRole as keyof typeof ROLE_LABELS]}":`) || '';
        if (!adminCode) {
            target.value = oldRole || 'user'; // Revert UI
            return;
        }
    } else {
        if (!confirm(`Змінити роль користувача ${user.name} на "${ROLE_LABELS[newRole as keyof typeof ROLE_LABELS]}"?`)) {
            target.value = oldRole || 'user'; // Revert UI
            return;
        }
    }

    try {
        await api.changeUserRole(user.id, newRole, adminCode);
        user.role = newRole;
        alert('Роль успішно змінено!');
    } catch (e: any) {
        target.value = oldRole || 'user'; // Revert UI
        alert(e.message);
    }
};

const canEditUser = (userRole: string | null | undefined) => {
    const targetLevel = getLevel(userRole);
    const myLevel = getLevel(actualRole.value);
    return myLevel > targetLevel || myLevel === 4; // superadmin can edit anyone
};

const canAssignRole = (roleOption: string) => {
    return getLevel(actualRole.value) >= getLevel(roleOption);
};
</script>

<template>
  <div>
    <h2 class="text-lg font-bold text-cinema-text mb-5">Керування користувачами</h2>
    <AppAdminTable :columns="['Ім\'я', 'Email', 'Роль', 'Реєстрація', 'Дії']" caption="Список користувачів">
        <tr v-for="user in users" :key="user.id" class="border-b border-white/5 transition-colors hover:bg-white/[0.025]">
            <td class="px-4 py-3 font-semibold">{{ user.name }}</td>
            <td class="px-4 py-3 text-white/60">{{ user.email }}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs font-bold" :class="user.role === 'superadmin' || user.role === 'admin' ? 'bg-accent/20 text-accent' : (user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60')">
                    {{ ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || 'Користувач' }}
                </span>
            </td>
            <td class="px-4 py-3 text-white/60 text-sm">
                {{ user.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA') : '—' }}
            </td>
            <td class="px-4 py-3">
                <select 
                    v-if="canEditUser(user.role)" 
                    :value="user.role || 'user'" 
                    @change="handleRoleChange(user, $event)"
                    class="bg-[#1e1e1e] border border-white/20 text-white px-2 py-1.5 rounded text-xs font-bold cursor-pointer hover:border-white/40 focus:outline-none transition-colors"
                >
                    <option v-for="(label, key) in ROLE_LABELS" :key="key" :value="key" :disabled="!canAssignRole(key as string)">
                        {{ label }}
                    </option>
                </select>
                <span v-else class="text-white/30 text-xs italic px-2">Немає доступу</span>
            </td>
        </tr>
    </AppAdminTable>
  </div>
</template>
