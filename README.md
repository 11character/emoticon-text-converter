# Emoticon Text Converter

`contenteditable` 요소를 활용하여 텍스트 키워드(예: `:smile:`)를 실시간으로 이모티콘 이미지로 변환해주는 범용 라이브러리입니다. **TypeScript**를 완벽하게 지원하며 순수 자바스크립트 환경에서도 사용 가능합니다.

[**🚀 라이브 데모 확인하기**](https://lep.github.io/emoticon-text-converter/)

## 주요 특징

- **실시간 변환**: 사용자가 `:keyword:` 형태의 텍스트를 입력하면 즉시 지정된 이미지로 변환합니다.
- **스마트 커서 유지**: HTML 구조가 변경되더라도 사용자의 논리적인 커서 위치를 정확하게 유지합니다.
- **TypeScript 지원**: 강력한 타입 추론과 인터페이스를 제공하여 개발 생산성을 높입니다.
- **Zero Dependency**: 외부 프레임워크없이 동작합니다.
- **커스텀 이벤트**: `input`, `enter`, `focus`, `blur` 등 표준 및 커스텀 이벤트를 통해 상태를 쉽게 구독할 수 있습니다.
- **보안**: `textContent`를 통한 자동 엔티티화로 XSS 공격을 방지합니다.

## 설치 방법

```bash
npm install emoticon-text-converter
```

## 사용 방법

### 1. HTML 준비

```html
<div id="my-editor" style="border: 1px solid #ccc; min-height: 100px;"></div>
```

### 2. 라이브러리 초기화 (TypeScript/ESM)

```typescript
import { EmoticonTextConverter, KeywordMap } from 'emoticon-text-converter';

const keywordMap: KeywordMap = {
    'smile': { url: 'https://example.com/smile.png', useLevel: 0 },
    'heart': { url: 'https://example.com/heart.png', useLevel: 0 }
};

const converter = new EmoticonTextConverter({
    target: '#my-editor',
    keywordMap: keywordMap,
    emoticonSize: 24,
    placeholder: '메시지를 입력하세요...'
});

// 이벤트 구독
const editor = converter.getElement();
editor.addEventListener('input', (e) => {
    // CustomEvent.detail에 변환된 순수 텍스트가 담깁니다.
    const detail = (e as CustomEvent).detail;
    console.log('현재 텍스트:', detail); 
});

editor.addEventListener('enter', (e) => {
    console.log('전송 시도:', (e as CustomEvent).detail);
});
```

## API Specification

### Constructor Options

| 옵션명 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `target` | `string` \| `HTMLElement` | `null` | 에디터로 사용할 DOM 요소 또는 셀렉터 |
| `keywordMap` | `Object` | `{}` | 키워드별 이미지 URL 및 권한 설정 정보 |
| `emoticonSize` | `number` | `28` | 이모티콘 이미지의 가로/세로 크기(px) |
| `userEmoticonLevel` | `number` | `0` | 현재 사용자의 레벨 (이모티콘의 `useLevel`과 비교) |
| `placeholder` | `string` | `''` | 입력창이 비었을 때 표시할 문구 |

### Methods

- **`getText()`**: 현재 에디터의 내용을 이모티콘 키워드가 포함된 순수 텍스트로 반환합니다.
- **`setText(text)`**: 에디터에 특정 텍스트를 설정하고 HTML로 변환하여 렌더링합니다.
- **`insertText(text)`**: 현재 커서 위치에 텍스트를 삽입합니다.
- **`appendEmoticon(emoticon)`**: 현재 커서 위치에 이모티콘(예: `:smile:`)을 추가합니다.
- **`clear()`**: 에디터의 내용을 모두 지웁니다.
- **`getElement()`**: 에디터 DOM 요소를 반환합니다.

## 개발 및 테스트

```bash
# 의존성 설치
npm install

# 테스트 실행
npm test
```

## 라이선스

MIT License.
