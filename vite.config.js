
import path from 'path'

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  build: {
    // 开启Library Mode
    lib: {
      // required: path to your library entry
      entry: path.resolve(__dirname, 'src/main.ts'),
      // required for UMD: the global variable name for consumers using <script>
      name: 'WebSerialWrapper',
      // only UMD as requested
      formats: ['umd'],
      // output file name pattern
      fileName: (format) => `web-serial-wrapper.${format}.js`,
      formats: ['umd'] // 指定输出UMD格式
    }
  }
}

export default config
