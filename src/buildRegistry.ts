import fs from 'node:fs';

import { JSDOM } from 'jsdom';

import getEntryPoints from './getEntryPoints';

export default function buildRegistry(filePath: string) {
    const contents = fs.readFileSync(filePath);
    const dom = new JSDOM(contents);
    const linkTags = getEntryPoints({ linkTags: dom.window.document.querySelectorAll('link[rel="stylesheet"]') });
    const scriptTags = getEntryPoints({ scriptTags: dom.window.document.querySelectorAll('script[src]') });

    return { linkTags, scriptTags, dom };
}