import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EmoticonTextConverter',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 라이브러리에 포함하지 않을 외부 종속성을 여기에 나열합니다.
      // 현재는 의존성이 없으므로 비워둡니다.
      external: [],
      output: {
        globals: {
          // 외부 종속성을 UMD 빌드에서 사용할 변수 이름으로 매핑합니다.
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      copyDtsFiles: false,
      exclude: ['**/*.test.ts'],
      compilerOptions: {
        declarationMap: false, // .d.ts.map 파일 생성 안함
      }
    }),
  ],
});
