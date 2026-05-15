[🇰🇷 한국어 (Korean)](./README.ko.md) | [🇺🇸 English (English)](./README.md)

# Emoticon Text Converter

[![ko-fi](./assets/kofi-button-ko.svg)](https://ko-fi.com/11character)

**실시간 채팅, 댓글 시스템, 커뮤니티 에디터**에 최적화된 초경량(Zero-dependency) 텍스트-이모티콘 변환 라이브러리입니다. 사용자가 입력하는 텍스트 키워드(예: `:smile:`)를 즉시 시각적인 이미지로 변환하여 더욱 풍부한 커뮤니케이션 경험을 제공합니다.

### 🚀 이런 곳에 바로 활용하세요
- **실시간 채팅 앱**: 카카오톡이나 슬랙처럼 사용자가 입력하는 즉시 이모티콘이 변환되는 채팅창을 구현할 때.
- **댓글 및 답글 시스템**: 블로그, 뉴스, 커뮤니티의 댓글창에서 사용자 참여도를 높이고 싶을 때.
- **고객 상담 센터 및 대시보드**: 실시간 상담 툴에서 텍스트 위주의 딱딱한 상담 대신 친근한 인터페이스를 구축할 때.
- **대형 게시판 및 SNS**: 복잡한 에디터 없이도 가볍고 직관적인 입력 환경이 필요할 때.

### 💎 핵심 강점 (SEO & UX)
- **독보적인 커서 유지 기술**: 단순히 `innerHTML`을 교체하는 방식과 달리, 자체 개발한 `CursorManager`를 통해 변환 도중에도 커서가 튀지 않고 정확한 위치를 유지합니다.
- **성능 및 확장성**: 키워드 및 권한 조회에 $O(1)$ 기반 알고리즘을 적용하여, 대규모 키워드 맵 환경에서도 빠르고 안정적인 변환 성능을 유지합니다. `TreeWalker`를 통한 최소한의 DOM 순회로 부하를 줄였습니다.
- **보안 및 안전성**: XSS 공격 방지를 위한 텍스트 엔티티화 및 비정상적인 드롭 이벤트 차단이 내장되어 있습니다.
- **자유로운 호환성**: React, Vue, Angular 등 어떤 프레임워크에서도, 혹은 순수 자바스크립트 환경에서도 즉시 도입 가능합니다.

[**🔗 라이브 데모 확인하기**](https://11character.github.io/emoticon-text-converter/)

## 주요 특징

- **실시간 변환**: 사용자가 `:keyword:` 형태의 텍스트를 입력하면 즉시 지정된 이미지로 변환합니다.
- **정밀한 커서 유지**: HTML 구조가 변경되더라도 `TreeWalker`와 `Range` API를 사용하여 사용자의 논리적인 커서 위치를 정확하게 유지합니다.
- **권한 시스템**: `allowedGroups` 설정을 통해 사용자 그룹별로 이모티콘 노출 권한을 유연하게 제어할 수 있습니다 ($O(1)$ 검색 최적화).
- **TypeScript 지원**: 강력한 타입 추론과 인터페이스를 제공하여 개발 생산성을 높입니다.
- **Zero Dependency**: 외부 프레임워크나 라이브러리 없이 독립적으로 동작합니다.
- **안전한 이벤트 처리**: IME(한글 등) 입력 및 조합 상태를 감지하여 변환 시점의 충돌을 방지합니다.
- **보안**: 내부적으로 텍스트 엔티티화를 수행하고 드롭(Drop) 이벤트를 차단하여 XSS 공격으로부터 안전합니다.

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

// 1. 키워드 맵 정의 (url 및 접근 가능한 그룹 설정)
const keywordMap: KeywordMap = {
    'smile': { url: 'https://example.com/smile.png', groups: ['free', 'premium'] },
    'heart': { url: 'https://example.com/heart.png', groups: ['premium'] }
};

// 2. 컨버터 인스턴스 생성
const converter = new EmoticonTextConverter({
    target: '#my-editor',
    keywordMap: keywordMap,
    emoticonSize: 24,
    allowedGroups: { 'free': true }, // 현재 사용자가 속한 그룹
    placeholder: '메시지를 입력하세요...',
    onInput: (text) => {
        console.log('현재 텍스트:', text); // ":smile: 안녕하세요"
    },
    onEnter: (text) => {
        console.log('메시지 전송:', text);
        converter.clear();
    }
});
```

## API Specification

### 1. KeywordMap & EmoticonItem
`keywordMap` 객체는 어떤 키워드가 어떤 이미지로 변환될지, 그리고 누가 볼 수 있는지를 정의합니다.

| 속성명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `[key: string]` | `EmoticonItem` | 트리거가 될 키워드 (예: `:smile:`에서 `smile`). |

#### EmoticonItem 객체
| 속성명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `url` | `string` | **(필수)** 이모티콘 이미지의 절대 또는 상대 경로 URL. |
| `groups` | `string[]` | *(선택)* 해당 이모티콘을 사용할 수 있는 그룹 목록. |

### 2. 생성자 옵션 (EmoticonTextConverterOptions)

| 옵션명 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `target` | `string` \| `HTMLElement` | `null` | 에디터로 사용할 DOM 요소 또는 셀렉터. |
| `keywordMap` | `KeywordMap` | `{}` | 키워드별 이미지 URL 및 권한 설정 정보. |
| `emoticonSize` | `number` | `28` | 이모티콘 이미지의 가로/세로 크기(px). |
| `allowedGroups` | `Record<string, boolean>` | `{}` | 현재 사용자가 속한 그룹 권한 맵 (예: `{ free: true }`). |
| `placeholder` | `string` | `''` | 에디터가 비었을 때 표시할 안내 문구. |
| `disableEnter` | `boolean` | `false` | `true`일 경우 엔터 키를 통한 줄바꿈을 방지합니다. |
| `onInput` | `(text: string) => void` | `undefined` | 텍스트 내용이 변경될 때마다 호출되는 콜백. |
| `onEnter` | `(text: string) => void` | `undefined` | 엔터 키가 눌렸을 때 호출되는 콜백 (Shift+Enter 제외). |
| `onFocus` | `() => void` | `undefined` | 에디터에 포커스가 잡혔을 때 호출되는 콜백. |
| `onBlur` | `() => void` | `undefined` | 에디터에서 포커스가 나갔을 때 호출되는 콜백. |

### 3. Methods

- **`getText()`**: 현재 에디터의 내용을 이모티콘 키워드가 포함된 순수 텍스트로 반환합니다.
- **`setText(text)`**: 에디터에 특정 텍스트를 설정하고 HTML로 변환하여 렌더링합니다.
- **`insertText(text)`**: 현재 커서 위치에 텍스트를 삽입합니다.
- **`addKeyword(key, item)`**: 새로운 이모티콘 키워드를 맵에 추가하거나 덮어쓰고 즉시 렌더링합니다.
- **`removeKeyword(key)`**: 특정 이모티콘 키워드를 맵에서 제거하고 즉시 렌더링합니다.
- **`getKeywordMap()`**: 현재 설정된 이모티콘 맵 객체를 반환합니다.
- **`setOptions(options)`**: 동적으로 옵션을 변경하고 에디터 내용을 즉시 재변환합니다.
- **`getCursorPosition()`**: 현재 커서의 논리적 위치(이모티콘/BR을 1글자로 취급)를 반환합니다.
- **`clear()`**: 에디터의 내용을 모두 지웁니다.
- **`getElement()`**: 에디터 DOM 요소를 반환합니다.
- **`setReadonly(isReadonly)`**: 읽기 전용 상태를 동적으로 설정합니다.
- **`isReadonly()`**: 현재 읽기 전용 상태 여부를 반환합니다.
- **`setEmoticonSize(size)`**: 이모티콘의 크기(px)를 설정합니다.
- **`getEmoticonSize()`**: 현재 설정된 이모티콘 크기를 반환합니다.
- **`setPlaceholder(text)`**: 플레이스홀더 문구를 설정합니다.
- **`getPlaceholder()`**: 현재 설정된 플레이스홀더 문구를 반환합니다.
- **`setDisableEnter(disable)`**: 엔터 키 줄바꿈 비활성화 여부를 설정합니다.
- **`isDisableEnter()`**: 엔터 키 줄바꿈 비활성화 여부를 반환합니다.
- **`setAllowedGroups(groups)`**: 허용된 그룹 권한 맵을 설정합니다.
- **`getAllowedGroups()`**: 현재 허용된 그룹 권한 맵을 반환합니다.
- **`setGroupAllowed(groupName, isAllowed)`**: 특정 그룹의 허용 여부를 개별적으로 설정합니다.
- **`setClassPrefix(prefix)`**: CSS 클래스 접두사를 설정합니다.
- **`getClassPrefix()`**: 현재 설정된 CSS 클래스 접두사를 반환합니다.
- **`destroy()`**: 리스너를 해제하고 인스턴스를 정리합니다.

## 개발 및 테스트

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test
```

## 라이선스

MIT License.
선스

MIT License.
