import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // GitHub Pages 배포를 위한 상대 경로 설정
  build: {
    outDir: 'docs', // GitHub Pages가 인식할 수 있는 docs 폴더로 출력
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // 데모에서 src/index.ts를 직접 참조할 수 있도록 설정
      '@': resolve(__dirname, 'src'),
    },
  },
});
