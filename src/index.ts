import { PluginBuild, ResolveResult } from 'esbuild';

import type { JSDOM } from 'jsdom';

import buildRegistry from './buildRegistry';
import { dirname, join } from 'node:path';

const namespace = 'single-file-plugin';

const singleFilePlugin = () => ({
  name: 'single-file',
  setup(build: PluginBuild) {
    build.initialOptions.loader = build.initialOptions.loader || {};
    build.initialOptions.loader['.html'] = 'file';

    const registry = new Map<
      string,
      {
        dom: JSDOM;
        linkTags: Record<string, ResolveResult>;
        scriptTags: Record<string, ResolveResult>;
      }
    >();
    const watchFiles = new Set<string>();

    build.onResolve({ filter: /\.html$/ }, async (args) => {
      const { dom, linkTags, scriptTags } = buildRegistry(args.path);

      const linkTagsWithResolution = Object.fromEntries(
        await Promise.all(
          linkTags.map(async (linkTag) => {
            const resolveDir = join(args.resolveDir, dirname(args.path));
            const resolved = await build.resolve(linkTag, {
              kind: 'import-statement',
              resolveDir,
            });

            return [linkTag, resolved];
          }),
        ),
      );

      const scriptTagsWithResolution = Object.fromEntries(
        await Promise.all(
          scriptTags.map(async (scriptTag) => {
            const resolveDir = join(args.resolveDir, dirname(args.path));
            const resolved = await build.resolve(scriptTag, {
              kind: 'import-statement',
              resolveDir,
            });

            return [scriptTag, resolved];
          }),
        ),
      );

      registry.set(args.path, {
        dom,
        linkTags: linkTagsWithResolution,
        scriptTags: scriptTagsWithResolution,
      });

      return {
        path: args.path,
        namespace,
      };
    });

    build.onLoad({ filter: /.*/, namespace }, async (args) => {
      const registryEntry = registry.get(args.path);

      if (!registryEntry) {
        throw new Error('registry entry not found');
      }

      const { dom, linkTags, scriptTags } = registryEntry;

      await Promise.all(
        Object.entries(linkTags).map(async ([href, resolved]) => {
          const oldElement = dom.window.document.body.querySelector(
            `link[href="${href}"]`,
          );
          const newElement = dom.window.document.createElement('style');

          if (resolved.path) {
            const result = await build.esbuild.build({
              entryPoints: [resolved.path],
              bundle: true,
              write: false,
              format: 'esm',
              outfile: `${resolved.path}.out`,
            });

            if (result.outputFiles && result.outputFiles.length > 0) {
              newElement.textContent = result.outputFiles[0].text;
              if (
                result.outputFiles.length > 1 &&
                result.outputFiles[1].path.endsWith('.css')
              ) {
                const newStyleTag = dom.window.document.createElement('style');
                newStyleTag.textContent = result.outputFiles[1].text;
                dom.window.document.head.appendChild(newStyleTag);
              }
            } else {
              console.error('No output files generated for', href);
            }
          } else {
            console.error('Could not resolve path for', href);
          }

          if (oldElement) {
            oldElement.replaceWith(newElement);
          } else {
            console.error('could not find link tag', href);
          }
        }),
      );

      await Promise.all(
        Object.entries(scriptTags).map(async ([src, resolved]) => {
          const oldElement = dom.window.document.querySelector(
            `script[src="${src}"]`,
          );
          const newElement = dom.window.document.createElement('script');
          newElement.type = 'module';

          if (resolved.path) {
            const result = await build.esbuild.build({
              entryPoints: [resolved.path],
              bundle: true,
              write: false,
              format: 'esm',
              outfile: `${resolved.path}.js`,
              metafile: true,
            });

            watchFiles.add(resolved.path);

            if (result.metafile?.inputs) {
              for (const key of Object.keys(result.metafile?.inputs)) {
                watchFiles.add(key);
              }
            }

            if (result.outputFiles && result.outputFiles.length > 0) {
              newElement.textContent = result.outputFiles[0].text;
              if (
                result.outputFiles.length > 1 &&
                result.outputFiles[1].path.endsWith('.css')
              ) {
                const newStyleTag = dom.window.document.createElement('style');
                newStyleTag.textContent = result.outputFiles[1].text;
                dom.window.document.head.appendChild(newStyleTag);
              }
            } else {
              console.error('No output files generated for', src);
            }
          } else {
            console.error('Could not resolve path for', src);
          }

          if (oldElement) {
            oldElement.replaceWith(newElement);
          } else {
            console.error('could not find script tag', src);
          }
        }),
      );

      const contents = dom.serialize();

      const watchFilesArray = Array.from(watchFiles);

      return {
        contents,
        watchFiles: watchFilesArray,
        loader: 'copy',
      };
    });
  },
});

export default singleFilePlugin;
