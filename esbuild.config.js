const {nodeExternalsPlugin} =  require("esbuild-node-externals")
require('esbuild').build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: ['node16'],
    outfile: 'dist/index.js',
    plugins: [nodeExternalsPlugin()]
  })