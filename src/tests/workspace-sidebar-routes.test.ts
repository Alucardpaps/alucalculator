import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Workspace Sidebar & Module Routes Audit', () => {
  it('all 39 items in ALL_NAV_GROUPS should resolve without unwanted redirects', () => {
    const sidebarContent = fs.readFileSync(path.resolve('src/components/layout/DesktopSidebar.tsx'), 'utf8');
    const retiredCode = fs.readFileSync(path.resolve('src/config/retiredModules.ts'), 'utf8');
    const modulePageContent = fs.readFileSync(path.resolve('src/app/[module]/page.tsx'), 'utf8');
    const windowContent = fs.readFileSync(path.resolve('src/components/os/WindowContent.tsx'), 'utf8');

    const itemRegex = /\{\s*id:\s*'([^']+)',\s*href:\s*'([^']+)',\s*labelEn:\s*'([^']+)'/g;
    const items: { id: string; href: string; labelEn: string }[] = [];
    let match;
    while ((match = itemRegex.exec(sidebarContent)) !== null) {
      items.push({ id: match[1], href: match[2], labelEn: match[3] });
    }

    expect(items.length).toBe(49);

    const retiredEntries: Record<string, string> = {};
    const retRegex = /'([^']+)':\s*'([^']+)'/g;
    let retMatch;
    while ((retMatch = retRegex.exec(retiredCode)) !== null) {
      retiredEntries[retMatch[1]] = retMatch[2];
    }

    for (const item of items) {
      const cleanHref = item.href.replace(/^\//, '').replace(/\/$/, '');
      const directPath = path.resolve('src/app', cleanHref, 'page.tsx');
      const existsDirect = fs.existsSync(directPath);

      if (existsDirect) {
        const code = fs.readFileSync(directPath, 'utf8');
        // Must NOT redirect away from its intended module
        const redirectMatch = code.match(/redirect\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        const clientRedirectMatch = code.match(/router\.(?:replace|push)\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        
        expect(redirectMatch, `${item.id} (${item.href}) has direct redirect`).toBeNull();
        expect(clientRedirectMatch, `${item.id} (${item.href}) has client redirect`).toBeNull();
      } else {
        // Handled by [module] router
        expect(retiredEntries[cleanHref], `${item.id} (${item.href}) is retired-redirected`).toBeUndefined();

        // Mapped in SLUG_TO_MODULE
        const slugRegex = new RegExp(`'${cleanHref}':\\s*'([^']+)'`);
        const mMatch = modulePageContent.match(slugRegex);
        const mappedType = mMatch ? mMatch[1] : cleanHref;

        // Handled in WindowContent
        const caseRegex = new RegExp(`case\\s+'${mappedType}'`);
        expect(caseRegex.test(windowContent), `${item.id} (${mappedType}) must be handled in WindowContent`).toBe(true);
      }
    }
  });

  it('Column Buckling should have direct page', () => {
    expect(fs.existsSync(path.resolve('src/app/column-buckling/page.tsx'))).toBe(true);
  });
});
