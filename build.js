/**
 * {build}
 * @author yutent<yutent.io@gmail.com>
 * @date 2021/08/09 11:59:41
 */

import Es from 'esbuild'

const mode = process.argv.slice(2).shift()

Es.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  watch: mode === 'dev' ? true : false,
  minify: mode === 'dev' ? false : true,
  format: 'esm',
  outdir: 'dist'
})
