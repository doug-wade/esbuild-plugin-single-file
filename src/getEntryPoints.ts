interface getEntryPointsArgs {
    linkTags?: NodeListOf<HTMLLinkElement> | null;
    scriptTags?: NodeListOf<HTMLScriptElement> | null;
}

export default function getEntryPoints({ linkTags, scriptTags }: getEntryPointsArgs) {
    const filePaths = new Set<string>();

    if (linkTags) {
        linkTags.forEach((linkTag) => {
            const href = linkTag.getAttribute('href');

            if (href) {
                filePaths.add(href);
            }
        });
    }

    if (scriptTags) {
        scriptTags.forEach((scriptTag) => {
            const src = scriptTag.getAttribute('src');

            if (src) {
                filePaths.add(src);
            }
        });
    }

    return Array.from(filePaths.values());
}