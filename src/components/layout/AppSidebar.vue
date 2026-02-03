<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': effectiveExpanded || isMobileOpen,
        'lg:w-[90px]': !effectiveExpanded,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
  >
    <div
      :class="[
        'py-8 flex',
        !effectiveExpanded ? 'lg:justify-center' : 'justify-start',
      ]"
    >
          <dashboard-logo
        :show-text="effectiveExpanded || isMobileOpen"
        text-class="text-base sm:text-lg"
      />
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in visibleMenuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !effectiveExpanded
                  ? 'lg:justify-center'
                  : 'lg:justify-start',
              ]"
            >
              <template v-if="effectiveExpanded || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="effectiveExpanded || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                  <ChevronDownIcon
                    v-if="effectiveExpanded || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        'rotate-180 text-brand-500': isSubmenuOpen(
                          groupIndex,
                          index
                        ),
                      },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (effectiveExpanded || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.name }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

import {
  GridIcon,
  ChatIcon,
  MailIcon,
  DocsIcon,
  PieChartIcon,
  HorizontalDots,
  PageIcon,
  SettingsIcon,
} from "../../icons";
import DashboardLogo from "./header/DashboardLogo.vue";
import { useSidebar } from "@/composables/useSidebar";
import { useAuth } from "@/composables/useAuth";
import { useAdminVisibility } from "@/composables/useAdminVisibility";

const route = useRoute();
const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();
const { isAuthenticated, currentUser } = useAuth();

const effectiveExpanded = computed(
  () => isAuthenticated.value && isExpanded.value
);
const { getSettings } = useAdminVisibility();

const isEditorOrAdmin = computed(
  () =>
    currentUser.value?.role === "Admin" || currentUser.value?.role === "Editor"
);

const menuGroups = [
  {
    title: "Dashboard",
    items: [
      { icon: GridIcon, name: "Totale", path: "/", pageKey: "Totale" },
      { icon: ChatIcon, name: "Social", path: "/social", pageKey: "Social" },
      { icon: PieChartIcon, name: "Video", path: "/video", pageKey: "Video" },
      { icon: MailIcon, name: "Newsletter", path: "/newsletter", pageKey: "Newsletter" },
      { icon: PageIcon, name: "Analitiche Siti", path: "/siti", pageKey: "Siti" },
      { icon: DocsIcon, name: "Sondaggi", path: "/sondaggi", pageKey: "Sondaggi" },
    ],
  },
  {
    title: "Admin",
    items: [
      { icon: SettingsIcon, name: "Gestione Obiettivi", path: "/admin/goals" },
      { icon: SettingsIcon, name: "API Management", path: "/admin/api-management" },
    ],
  },
];

const visibleMenuGroups = computed(() => {
  const dashboard = menuGroups[0];
  const admin = menuGroups[1];

  const visibleDashboardItems = dashboard.items.filter((item) => {
    const s = getSettings(item.pageKey);
    if (isAuthenticated.value) {
      return s.isPublic || s.isVisibleForUsers || currentUser.value?.role === "Admin";
    }
    return s.isPublic;
  });

  const visibleAdminItems = admin.items.filter(() => isEditorOrAdmin.value);

  const groups: typeof menuGroups = [];

  if (visibleDashboardItems.length > 0) {
    groups.push({ ...dashboard, items: visibleDashboardItems });
  }
  if (visibleAdminItems.length > 0) {
    groups.push({ ...admin, items: visibleAdminItems });
  }

  return groups;
});

const isActive = (path: string) => route.path === path;

const toggleSubmenu = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isAnySubmenuRouteActive = computed(() => {
  return visibleMenuGroups.value.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
    )
  );
});

const isSubmenuOpen = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  const items = visibleMenuGroups.value[groupIndex]?.items ?? [];
  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      items[itemIndex]?.subItems?.some((subItem) => isActive(subItem.path)))
  );
};

const startTransition = (el) => {
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  el.offsetHeight; // force reflow
  el.style.height = height + "px";
};

const endTransition = (el) => {
  el.style.height = "";
};
</script>
