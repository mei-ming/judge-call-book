# Judge Call Book 教學網站

以 **Markdown 為唯一主要維護介面** 的 Web APP 教學網站，使用 VitePress 與 GitHub Pages 建置。

日常維護者只需要新增或修改 Markdown 文件與媒體檔案，提交並推送至 GitHub (`git push`)，後續的側邊欄生成、網站編譯與 GitHub Pages 部署皆由自動化工作流程處理。

---

## 快速開始（本地預覽）

若工程人員需在本地端進行預覽與除錯：

```bash
# 1. 安裝依賴
npm install

# 2. 啟動本地開發伺服器
npm run docs:dev

# 3. 測試構建與預覽
npm run docs:build
npm run docs:preview
```

---

## 日常維護指南

### 1. 新增或編輯文件

在 `docs/` 下的對應分類目錄建立或編輯 `.md` 檔案，例如：`docs/features/my-feature.md`。

每個 Markdown 文件頂部建議加入 Frontmatter：

```md
---
title: 我的功能名稱
order: 30
---

# 我的功能名稱

此處開始撰寫功能介紹與說明內容...
```

- `title`：側邊欄與頁面顯示之標題（若無則自動提取第一個一級標題 `# Heading` 或檔案名稱）。
- `order`：側邊欄排序權重（由小到大排序，預設 9999）。
- `hidden`（可選）：設為 `true` 則不列入側邊欄導航。

> [!NOTE]
> **您不需要手動修改任何側邊欄配置檔**！系統在編譯前會自動掃描並動態產生最新側邊欄。

---

### 2. 新增媒體資源

所有靜態媒體皆統一放置於 `docs/public/media/` 目錄：

#### 靜態圖片
- 放置路徑：`docs/public/media/images/example.webp`
- Markdown 引用：
  ```md
  ![圖片說明](/media/images/example.webp)
  ```

#### Animated WebP (微互動動畫，3~8 秒無聲)
- 放置路徑：`docs/public/media/animations/example.webp`
- Markdown 引用：
  ```md
  ![動態展示](/media/animations/example.webp)
  ```

#### MP4 流程影片
- 放置路徑：`docs/public/media/videos/example.mp4`
- Markdown 引用（使用 HTML5 video 標籤）：
  ```html
  <video controls playsinline preload="metadata" style="width: 100%;">
    <source src="/media/videos/example.mp4" type="video/mp4">
  </video>
  ```

---

### 3. Scribe 逐步操作教學嵌入

若需嵌入 Scribe 產生的逐步操作流程：

```html
<iframe
  src="https://scribehow.com/embed/YOUR_SCRIBE_ID"
  width="100%"
  height="640"
  allowfullscreen
  frameborder="0"
></iframe>
```

---

### 4. 自動發布上線

日常維護發布流程極為單純：

```bash
# 建立/切換分支
git checkout -b docs/update-guide

# 修改完畢後加入變更
git add .
git commit -m "docs: update feature guide"
git push origin docs/update-guide
```

將 PR 合併至 `main` 分支後，GitHub Actions 將會自動執行構建並發布至 GitHub Pages。

---

## GitHub Pages 設定說明

首次建立專案時，請確認 Repository 設定已啟用 GitHub Actions 作為發布來源：

1. 開啟 GitHub 倉庫頁面。
2. 點選 **Settings** → **Pages**。
3. 在 **Build and deployment** 下的 **Source** 選擇 **GitHub Actions**。
4. 之後每次 push 到 `main` 分支即可自動更新網站。
