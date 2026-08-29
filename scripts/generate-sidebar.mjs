import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DOCS_ROOT = path.resolve('docs');
const OUTPUT_FILE = path.join(DOCS_ROOT, '.vitepress', 'sidebar.generated.json');

// Directory name to display name mapping
const SECTION_TITLES = {
  'getting-started': '快速開始',
  'features': '功能介紹',
  'troubleshooting': '疑難排解',
  'guide': '使用指南',
  'faq': '常見問答',
  'tables': '桌次管理',
  'penalties': '罰則系統'
};

/**
 * Capitalize string or format directory name
 */
function formatTitle(str) {
  if (SECTION_TITLES[str]) {
    return SECTION_TITLES[str];
  }
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract first H1 heading from markdown content
 */
function extractFirstH1(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Scan directory recursively for markdown files
 */
function scanDocs(dir, relativeTo = DOCS_ROOT) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath);

    // Exclude .vitepress, public, etc.
    if (entry.isDirectory()) {
      if (entry.name === '.vitepress' || entry.name === 'public' || entry.name === 'node_modules') {
        continue;
      }
      files = files.concat(scanDocs(fullPath, relativeTo));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Exclude root index.md from sidebar sections
      if (relPath === 'index.md') {
        continue;
      }
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate VitePress sidebar configuration
 */
export function generateSidebar() {
  if (!fs.existsSync(DOCS_ROOT)) {
    console.warn(`[Sidebar] Docs directory not found: ${DOCS_ROOT}`);
    return {};
  }

  const mdFiles = scanDocs(DOCS_ROOT);
  
  // Structure: { [sectionKey]: { rootItems: [], subGroups: { [subKey]: { title, order, collapsed, items: [] } } } }
  const sectionData = {};

  for (const filePath of mdFiles) {
    const relativePath = path.relative(DOCS_ROOT, filePath);
    const normalizedRelPath = relativePath.split(path.sep).join('/');
    const pathParts = normalizedRelPath.split('/');

    // Top-level section folder (e.g. 'features', 'getting-started')
    const sectionKey = pathParts[0];
    if (!sectionKey) continue;

    if (!sectionData[sectionKey]) {
      sectionData[sectionKey] = {
        rootItems: [],
        subGroups: {}
      };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Skip hidden files
    if (frontmatter.hidden === true) {
      continue;
    }

    const title = frontmatter.title || extractFirstH1(content) || path.basename(filePath, '.md');
    const order = typeof frontmatter.order === 'number' ? frontmatter.order : 9999;
    
    // Construct VitePress link (without .md, index becomes '/')
    let linkPath = '/' + normalizedRelPath.replace(/\.md$/, '');
    if (linkPath.endsWith('/index')) {
      linkPath = linkPath.slice(0, -5); // e.g. /features/tables/
    }

    const itemObj = {
      text: title,
      link: linkPath,
      order: order,
      filename: path.basename(filePath)
    };

    // Check if file is in a sub-directory or has explicit frontmatter group
    if (frontmatter.group) {
      const groupKey = frontmatter.group;
      if (!sectionData[sectionKey].subGroups[groupKey]) {
        sectionData[sectionKey].subGroups[groupKey] = {
          title: groupKey,
          order: typeof frontmatter.group_order === 'number' ? frontmatter.group_order : 9999,
          collapsed: frontmatter.collapsed !== undefined ? frontmatter.collapsed : false,
          items: []
        };
      }
      sectionData[sectionKey].subGroups[groupKey].items.push(itemObj);
    } else if (pathParts.length > 2) {
      // It's in a subdirectory: docs/<section>/<subDir>/...
      const subDir = pathParts[1];
      if (!sectionData[sectionKey].subGroups[subDir]) {
        // Find default title from SECTION_TITLES or format
        const defaultTitle = SECTION_TITLES[subDir] || formatTitle(subDir);
        sectionData[sectionKey].subGroups[subDir] = {
          title: defaultTitle,
          order: 9999,
          collapsed: false,
          items: []
        };
      }

      // If this file is index.md of the subDir, it can set the group's title and order
      if (pathParts.length === 3 && pathParts[2] === 'index.md') {
        if (frontmatter.title) {
          sectionData[sectionKey].subGroups[subDir].title = frontmatter.title;
        }
        if (typeof frontmatter.order === 'number') {
          sectionData[sectionKey].subGroups[subDir].order = frontmatter.order;
        }
        if (frontmatter.collapsed !== undefined) {
          sectionData[sectionKey].subGroups[subDir].collapsed = frontmatter.collapsed;
        }
      }

      sectionData[sectionKey].subGroups[subDir].items.push(itemObj);
    } else {
      // Top-level item within this section
      sectionData[sectionKey].rootItems.push(itemObj);
    }
  }

  // Sort and build final sidebar object
  const sidebar = {};

  for (const [sectionKey, data] of Object.entries(sectionData)) {
    const sectionSidebar = [];

    // 1. Sort root items
    data.rootItems.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.filename === 'index.md') return -1;
      if (b.filename === 'index.md') return 1;
      return a.filename.localeCompare(b.filename);
    });

    // 2. Sort sub-groups
    const sortedSubGroups = Object.entries(data.subGroups).map(([key, group]) => {
      // Sort items within subgroup
      group.items.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.filename === 'index.md') return -1;
        if (b.filename === 'index.md') return 1;
        return a.filename.localeCompare(b.filename);
      });
      return { key, ...group };
    });

    sortedSubGroups.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

    // If there are sub-groups, construct multi-group / nested structure
    // 1. Direct root items (e.g. 快速開始總覽、功能總覽) at top level
    for (const item of data.rootItems) {
      sectionSidebar.push({ text: item.text, link: item.link });
    }

    // 2. Collapsible sub-groups (only created when subdirectories or groups exist)
    for (const group of sortedSubGroups) {
      sectionSidebar.push({
        text: group.title,
        collapsed: group.collapsed,
        items: group.items.map(({ text, link }) => ({ text, link }))
      });
    }

    sidebar[`/${sectionKey}/`] = sectionSidebar;
  }

  // Ensure directory exists
  const vitepressDir = path.join(DOCS_ROOT, '.vitepress');
  if (!fs.existsSync(vitepressDir)) {
    fs.mkdirSync(vitepressDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sidebar, null, 2), 'utf-8');
  console.log(`[Sidebar] Generated sidebar configuration at ${OUTPUT_FILE}`);
  return sidebar;
}

// Execute if run from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  generateSidebar();
}
