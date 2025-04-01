# esbuild-plugin-single-file

## Installation

```sh
npm install --save-dev esbuild esbuild-plugin-single-file
```

## Getting Started

To build:

```js
import esbuild from 'esbuild';
import singleFilePlugin from 'esbuild-plugin-single-file';

await esbuild.build({
  entryPoints: ['src/app/index.html'],
  outfile: 'dist/index.html',
  bundle: true,
  plugins: [singleFilePlugin()],
});
```

To watch:

```js
import esbuild from 'esbuild';
import singleFilePlugin from 'esbuild-plugin-single-file';

await esbuild.context({
  entryPoints: ['src/app/index.html'],
  outfile: 'dist/index.html',
  bundle: true,
  plugins: [singleFilePlugin()],
});

await context.watch();
```
