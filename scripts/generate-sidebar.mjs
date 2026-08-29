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
  'faq': '常見問答'
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
  const sections = {};

  for (const filePath of mdFiles) {
    const relativePath = path.relative(DOCS_ROOT, filePath);
    const normalizedRelPath = relativePath.split(path.sep).join('/');
    const pathParts = normalizedRelPath.split('/');

    // Top-level section folder
    const sectionDir = pathParts.length > 1 ? pathParts[0] : '';
    if (!sectionDir) continue;

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
      linkPath = linkPath.slice(0, -5); // e.g. /getting-started/
    }

    if (!sections[sectionDir]) {
      sections[sectionDir] = [];
    }

    sections[sectionDir].push({
      text: title,
      link: linkPath,
      order: order,
      filename: path.basename(filePath)
    });
  }

  // Sort and build final sidebar object
  const sidebar = {};

  for (const [sectionKey, items] of Object.entries(sections)) {
    // Sort items: by order ascending, then by filename
    items.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // If one is index, put it first
      if (a.filename === 'index.md') return -1;
      if (b.filename === 'index.md') return 1;
      return a.filename.localeCompare(b.filename);
    });

    const cleanItems = items.map(({ text, link }) => ({ text, link }));
    const sectionTitle = SECTION_TITLES[sectionKey] || formatTitle(sectionKey);

    const sectionConfig = [
      {
        text: sectionTitle,
        collapsed: false,
        items: cleanItems
      }
    ];

    sidebar[`/${sectionKey}/`] = sectionConfig;
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
