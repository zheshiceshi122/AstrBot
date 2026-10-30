import { markRaw, type Component } from 'vue';
import { Bot, Database, Puzzle } from '@lucide/vue';

interface menu {
  title: string;
  icon: Component;
  to: string;
  activePaths: string[];
}

const sidebarItem: menu[] = [
  { title: 'core.navigation.platforms', icon: markRaw(Bot), to: '/platforms', activePaths: ['/platforms', '/session-management', '/cron'] },
  { title: 'core.navigation.data', icon: markRaw(Database), to: '/data', activePaths: ['/data'] },
  { title: 'core.navigation.mobileExtensions', icon: markRaw(Puzzle), to: '/extensions', activePaths: ['/extensions', '/extension', '/persona', '/knowledge-base', '/subagent', '/plugin-view', '/plugin-page'] },
];

export default sidebarItem;
