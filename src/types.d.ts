export type RegistryEntry = {
  contents: Buffer<ArrayBufferLike>;
  dom: JSDOM;
  linkTags: { path: string; resolvedPath: string }[];
  scriptTags: { path: string; resolvedPath: string }[];
};
