import { BuildOptions } from 'esbuild';

import { RegistryEntry } from './types';

function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }

  if (value.some((v) => typeof v !== 'string')) {
    return false;
  }

  return true;
}

const safelyAddToEntryPoints = (
  entryPoint: string,
  entryPoints:
    | string[]
    | Record<string, string>
    | {
        in: string;
        out: string;
      }[],
) => {
  if (typeof entryPoints === 'object' && !Array.isArray(entryPoints)) {
    entryPoints[entryPoint] = entryPoint;
  } else if (isStringArray(entryPoints)) {
    entryPoints.push(entryPoint);
  } else {
    entryPoints.push({ in: entryPoint, out: entryPoint });
  }
};

export default function addAllEntryPointsFromRegistry(
  registry: Map<string, RegistryEntry>,
  buildOptions: BuildOptions,
) {
  const added = new Set<{ path: string; resolvedPath: string }>();
  const entryPoints = buildOptions.entryPoints || [];

  registry.forEach((entry) => {
    entry.linkTags.forEach((linkTag) => {
      if (added.has(linkTag)) {
        return;
      }
      safelyAddToEntryPoints(linkTag.resolvedPath, entryPoints);
    });

    entry.scriptTags.forEach((scriptTag) => {
      if (added.has(scriptTag)) {
        return;
      }

      safelyAddToEntryPoints(scriptTag.resolvedPath, entryPoints);
    });
  });

  return buildOptions.entryPoints;
}
