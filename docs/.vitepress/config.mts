import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';

// Load generated sidebar if exists
function getSidebar() {
  const sidebarPath = path.resolve(__dirname, 'sidebar.generated.json');
  if (fs.existsSync(sidebarPath)) {
    try {
      return JSON.parse(fs.readFileSync(sidebarPath, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse sidebar.generated.json:', e);
    }
  }
  return {};
}

const base = process.env.VITEPRESS_BASE || '/judge-call-book/';

export default defineConfig({
  title: 'Judge Call Book',
  description: 'Web APP 教學與使用手冊',
  lang: 'zh-TW',
  base: base,
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    siteTitle: 'Judge Call Book',
    logo: '/media/images/logo.svg',

    nav: [
      { text: '首頁', link: '/' },
      { text: '快速開始', link: '/getting-started/' },
      { text: '功能介紹', link: '/features/' },
      { text: '疑難排解', link: '/troubleshooting/' }
    ],

    sidebar: getSidebar(),

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜尋文件',
                buttonAriaLabel: '搜尋文件'
              },
              modal: {
                noResultsText: '找不到相關結果',
                resetButtonTitle: '清除查詢條件',
                footer: {
                  selectText: '選擇',
                  navigateText: '切換',
                  closeText: '關閉'
                }
              }
            }
          }
        }
      }
    },

    outline: {
      level: [2, 3],
      label: '本頁目錄'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    lastUpdated: {
      text: '最後更新於'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: '基於 VitePress 與 GitHub Pages 建置',
      copyright: 'Copyright © 2026 Judge Call Book'
    }
  }
});
