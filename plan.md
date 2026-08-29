# Web APP 教學網站建置計劃書

## 1. 專案目標

建立一套以 **Markdown 為唯一主要維護介面** 的 Web APP 教學網站。

網站需求如下：

* 使用 **VitePress** 產生靜態文件網站
* 使用 **GitHub Repository** 管理所有文件與媒體
* 使用 **GitHub Actions** 自動 Build 與部署
* 使用 **GitHub Pages** 作為正式網站 Hosting
* 日常維護者原則上只需要：

  * 新增或修改 `.md`
  * 新增圖片、Animated WebP 或 MP4
  * `git push`
* 不使用 GitBook SaaS
* 不需要人工執行 VitePress Build
* 不需要人工部署 GitHub Pages
* 側邊欄與導航盡量根據 Markdown 文件自動生成
* 支援嵌入 Scribe 教學
* 支援 Animated WebP
* 支援 MP4
* 保持架構簡單、低維護成本

---

# 2. 技術選型

## Documentation framework

使用：

```text
VitePress
```

用途：

* Markdown → Static HTML
* Sidebar
* Navigation
* 搜尋
* Responsive layout
* 自訂 Vue / HTML component
* GitHub Pages 部署

---

## Source control

使用：

```text
GitHub
```

Repository 建議名稱：

```text
help-center
```

---

## Hosting

使用：

```text
GitHub Pages
```

正式網站：

```text
https://<username>.github.io/help-center/
```

未來若設定 Custom Domain，可改為：

```text
https://help.example.com
```

---

## CI/CD

使用：

```text
GitHub Actions
```

觸發條件：

```text
push to main
```

流程：

```text
Markdown / Assets
       ↓
Git Push
       ↓
GitHub Actions
       ↓
npm ci
       ↓
VitePress Build
       ↓
GitHub Pages Artifact
       ↓
Deploy Pages
```

---

# 3. Repository 結構

建立以下結構：

```text
help-center/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── docs/
│   │
│   ├── .vitepress/
│   │   ├── config.mts
│   │   └── theme/
│   │       └── index.ts
│   │
│   ├── public/
│   │   └── media/
│   │       ├── images/
│   │       ├── animations/
│   │       └── videos/
│   │
│   ├── index.md
│   │
│   ├── getting-started/
│   │   ├── index.md
│   │   └── login.md
│   │
│   ├── features/
│   │   ├── index.md
│   │   └── example-feature.md
│   │
│   └── troubleshooting/
│       └── index.md
│
├── scripts/
│   └── generate-sidebar.mjs
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# 4. 文件維護原則

日常維護者應盡量只修改：

```text
docs/**/*.md
```

以及：

```text
docs/public/media/**
```

不應要求一般文件維護者修改：

```text
config.mts
deploy.yml
package.json
```

除非網站架構本身需要調整。

---

# 5. Markdown 文件格式

每個文件建議使用 Frontmatter。

範例：

```md
---
title: 資料同步
order: 20
---

# 資料同步

資料同步功能可以將外部資料與目前專案內容同步。

## 如何啟用

請依照以下步驟完成設定。

...
```

至少支援：

```yaml
title:
order:
```

可選支援：

```yaml
description:
hidden:
```

---

# 6. Sidebar 自動生成

不得要求維護者每新增一篇文件，就手動修改 VitePress sidebar。

實作：

```text
scripts/generate-sidebar.mjs
```

Build 前自動掃描：

```text
docs/**/*.md
```

排除：

```text
docs/index.md
docs/.vitepress/**
docs/public/**
```

根據目錄結構產生 Sidebar。

例如：

```text
docs/
├── getting-started/
│   ├── index.md
│   └── login.md
│
└── features/
    ├── index.md
    ├── synchronization.md
    └── webhook.md
```

應自動生成類似：

```text
快速開始
├─ 總覽
└─ 登入

功能
├─ 總覽
├─ 資料同步
└─ Webhook
```

排序優先使用：

```yaml
order:
```

如果沒有 `order`：

按：

```text
filename
```

排序。

---

# 7. Media 管理規範

統一放置：

```text
docs/public/media/
```

分類：

```text
media/
├── images/
├── animations/
└── videos/
```

用途：

### 靜態圖片

```text
images/
```

例如：

```text
dashboard.webp
settings.webp
```

Markdown：

```md
![Dashboard](/media/images/dashboard.webp)
```

---

### Animated WebP

```text
animations/
```

適合：

* 3～8 秒
* 無聲
* loop
* UI 微互動
* 狀態切換示範

引用：

```md
![同步狀態變化](/media/animations/sync-status.webp)
```

---

### MP4

```text
videos/
```

適合：

* 長一點的流程
* 有明確開始與結束
* 需要 pause
* 需要 seek

Markdown 內允許：

```html
<video
  controls
  playsinline
  preload="metadata"
  style="width: 100%;"
>
  <source
    src="/media/videos/sync-flow.mp4"
    type="video/mp4"
  >
</video>
```

---

# 8. MP4 規格

建議：

```text
Codec: H.264
Resolution: 1280×720
Frame rate: 30 fps
Fast Start: enabled
Audio: optional
```

影片應適合網頁播放。

如果可用 ffmpeg：

```bash
ffmpeg \
  -i input.mp4 \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -movflags +faststart \
  -c:a aac \
  output.mp4
```

無聲影片：

```bash
ffmpeg \
  -i input.mp4 \
  -an \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -movflags +faststart \
  output.mp4
```

不要求 CI 自動轉碼。

---

# 9. Scribe 整合

Scribe 是主要的逐步操作教學工具。

文件中應允許使用：

```md
## 完整操作教學

[Scribe 操作教學](https://scribehow.com/...)
```

如果 Scribe 提供可嵌入 iframe：

```html
<iframe
  src="SCRIBE_EMBED_URL"
  width="100%"
  height="640"
  frameborder="0"
  allowfullscreen
></iframe>
```

VitePress 應保留 Markdown 內的 HTML。

---

# 10. 內容角色規則

文件內容遵守以下分工：

```text
Markdown
→ 解釋功能與概念

Scribe
→ 怎麼操作

Animated WebP
→ 短 UI 動態

MP4
→ 完整動畫或流程說明
```

不要讓不同媒體重複相同內容。

---

# 11. VitePress 初始化

建立：

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:sidebar": "node scripts/generate-sidebar.mjs",
    "docs:build": "npm run docs:sidebar && vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

Build 必須自動先執行：

```text
generate-sidebar
```

再：

```text
vitepress build
```

---

# 12. Base Path

必須正確處理 GitHub Project Pages。

如果 repository 名稱：

```text
help-center
```

且沒有 Custom Domain：

```ts
base: '/help-center/'
```

如果使用 Custom Domain：

```ts
base: '/'
```

建議允許透過環境變數決定：

```text
VITEPRESS_BASE
```

例如：

```ts
const base = process.env.VITEPRESS_BASE || '/';
```

如此未來切換 Custom Domain 不需要大量修改。

---

# 13. GitHub Actions

建立：

```text
.github/workflows/deploy.yml
```

需求：

* Trigger:

  * push main
  * workflow_dispatch
* Node 使用目前穩定 LTS
* 使用 npm cache
* `npm ci`
* Build VitePress
* Upload Pages Artifact
* Deploy GitHub Pages

建議基本結構：

```yaml
name: Deploy documentation

on:
  push:
    branches:
      - main

  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - run: npm run docs:build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

      - id: deployment
        uses: actions/deploy-pages@v4
```

Agent 執行時應確認 GitHub Pages 官方 Action 是否已有較新穩定 major version；如果有，採用目前官方推薦版本。

---

# 14. GitHub Pages 設定

README 中提供設定說明：

```text
Repository
→ Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

完成後：

```text
push main
```

即可自動發布。

---

# 15. Local Development

雖然日常使用不需要 local build，但工程人員仍應可以：

```bash
npm install
npm run docs:dev
```

本機預覽。

Production 測試：

```bash
npm run docs:build
npm run docs:preview
```

---

# 16. 搜尋

優先使用 VitePress 內建 local search。

不要第一階段加入：

```text
Algolia
第三方搜尋 SaaS
外部 backend
```

設定：

```ts
themeConfig: {
  search: {
    provider: 'local'
  }
}
```

---

# 17. Navigation

至少提供：

```text
首頁
快速開始
功能
疑難排解
```

頂部 nav 不需要完全自動化。

Sidebar 必須自動化。

---

# 18. Theme

第一階段以 VitePress 預設 Theme 為主。

只做必要調整：

* 中文 zh-TW
* Logo
* Site title
* Search
* Sidebar
* Outline
* GitHub link
* Footer
* Edit link（如果適用）

不要在第一階段建立大量客製 UI。

---

# 19. Markdown 連結規則

內部文件：

```md
[資料同步](/features/synchronization)
```

或使用 VitePress 支援的相對 Markdown link。

媒體：

```md
![圖片](/media/images/example.webp)
```

所有資產 URL 應避免依賴 GitHub raw URL。

---

# 20. Git workflow

正常維護：

```bash
git checkout -b docs/update-sync-guide
```

修改：

```text
docs/features/synchronization.md
```

然後：

```bash
git add .
git commit -m "docs: update synchronization guide"
git push
```

Merge 到：

```text
main
```

後由 GitHub Actions 自動發布。

---

# 21. README

建立完整 README，說明：

## 新增文章

例如：

```text
docs/features/new-feature.md
```

寫：

```md
---
title: 新功能
order: 30
---

# 新功能

...
```

不需要修改 sidebar。

---

## 加圖片

放：

```text
docs/public/media/images/example.webp
```

引用：

```md
![Example](/media/images/example.webp)
```

---

## 加動畫

放：

```text
docs/public/media/animations/example.webp
```

---

## 加影片

放：

```text
docs/public/media/videos/example.mp4
```

---

## 發布

只需要：

```bash
git push
```

---

# 22. Agent 驗收項目

完成後必須自行驗證：

### Build

```bash
npm ci
npm run docs:build
```

成功。

---

### Sidebar

新增測試文件：

```text
docs/features/sidebar-test.md
```

重新 build 後自動出現在 sidebar。

測試完成後刪除。

---

### WebP

確認：

```text
/media/animations/*.webp
```

可以正常顯示。

---

### MP4

確認：

```text
/media/videos/*.mp4
```

可以播放。

---

### Markdown HTML

確認 `<video>` 可以正常 render。

---

### Search

確認 local search 可以搜尋：

* 中文標題
* 中文正文

---

### Routing

確認：

* 首頁
* 子目錄
* Reload deep link

在 GitHub Pages 環境正常工作。

---

### GitHub Pages

確認 Build Artifact 來源：

```text
docs/.vitepress/dist
```

正確。

---

# 23. 非目標

第一階段不要實作：

* GitBook
* GitBook CLI
* GitBook SaaS
* CMS
* Database
* Backend
* Remotion runtime
* Remotion Player
* MP4 自動 render
* AI 自動撰寫文件
* Algolia
* Cloudflare R2
* 自訂搜尋 backend
* 複雜 Vue component library

保持：

```text
Markdown
+
Static Media
+
VitePress
+
GitHub Actions
+
GitHub Pages
```

---

# 24. 最終使用體驗

文件維護者：

```text
新增 .md
     ↓
加入圖片 / WebP / MP4
     ↓
git push
```

其餘流程：

```text
GitHub
   ↓
Actions
   ↓
Generate Sidebar
   ↓
VitePress Build
   ↓
GitHub Pages
   ↓
Help Center 更新
```

不應要求文件維護者手動：

```text
npm install
npm run build
npm run deploy
修改 sidebar
登入任何 SaaS 文件平台
```

---

# 25. Agent 最終交付物

Agent 應交付：

```text
1. 完整 VitePress project
2. package.json
3. package-lock.json
4. VitePress config
5. 自動 sidebar generator
6. GitHub Actions Pages workflow
7. 範例 Markdown 文件
8. WebP 範例引用
9. MP4 範例引用
10. Scribe 範例
11. README 維護指南
```

並確保：

```bash
npm ci
npm run docs:build
```

在乾淨環境可以成功執行。

最終核心原則：

> 文件作者只維護 Markdown 與靜態媒體；網站生成、導航生成與部署全部由 GitHub 自動處理。
