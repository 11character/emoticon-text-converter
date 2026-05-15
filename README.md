[🇺🇸 English (English)](./README.md) | [🇰🇷 한국어 (Korean)](./README.ko.md)

# Emoticon Text Converter

[![ko-fi](./assets/kofi-button-en.svg)](https://ko-fi.com/11character)

A **lightweight, zero-dependency** TypeScript library that transforms text keywords (e.g., `:smile:`) into visual emoticon images in real-time. Built specifically for modern web interfaces requiring rich text input without the overhead of heavy editors.

### 🚀 Optimized for Real-time Interactions
This library is the perfect choice for developers building:
- **Real-time Chat Applications**: Seamlessly convert symbols to emoticons as users type.
- **Dynamic Comment Systems**: Enhance user engagement in community or blog comment sections.
- **Customer Support Tools**: Improve clarity in live dashbaords and help desks.
- **Social Media Platforms**: Provide a familiar, rich input experience for status updates.

### 💎 Why Emoticon Text Converter?
- **Flawless Cursor Management**: Unlike simple `innerHTML` replacements, our `CursorManager` ensures the cursor never jumps, even during complex DOM updates.
- **High Performance & Scalability**: Optimized with $O(1)$ lookup for both keywords and permissions, ensuring stable performance even with large-scale keyword maps. Uses an efficient `TreeWalker` for minimal DOM traversal.
- **Privacy & Security**: Built-in XSS protection and secure drop event handling.
- **Framework Agnostic**: Works perfectly with React, Vue, Angular, or pure Vanilla JS.

[**🔗 Check out the Live Demo**](https://11character.github.io/emoticon-text-converter/)

## Key Features

- **Real-time Conversion**: Instantly converts `:keyword:` text into specified images.
- **Precise Cursor Persistence**: Maintains the user's logical cursor position accurately using `TreeWalker` and `Range` APIs even when the HTML structure changes.
- **Permission System**: Flexible control over emoticon visibility by user groups using `allowedGroups` (optimized with $O(1)$ lookup).
- **TypeScript Support**: Enhances productivity with strong type inference and interfaces.
- **Zero Dependency**: Works independently without any external frameworks or libraries.
- **Safe Event Handling**: Detects IME (e.g., Korean) input and composition states to prevent conflicts during conversion.
- **Security**: Safe from XSS attacks by performing internal text entity encoding and blocking malicious drop events.

## Installation

```bash
npm install emoticon-text-converter
```

## Usage

### 1. Prepare HTML

```html
<div id="my-editor" style="border: 1px solid #ccc; min-height: 100px;"></div>
```

### 2. Initialize Library (TypeScript/ESM)

```typescript
import { EmoticonTextConverter, KeywordMap } from 'emoticon-text-converter';

// 1. Define Keyword Map (set URL and accessible groups)
const keywordMap: KeywordMap = {
    'smile': { url: 'https://example.com/smile.png', groups: ['free', 'premium'] },
    'heart': { url: 'https://example.com/heart.png', groups: ['premium'] }
};

// 2. Create Converter Instance
const converter = new EmoticonTextConverter({
    target: '#my-editor',
    keywordMap: keywordMap,
    emoticonSize: 24,
    allowedGroups: { 'free': true }, // Groups the current user belongs to
    placeholder: 'Enter your message...',
    onInput: (text) => {
        console.log('Current text:', text); // ":smile: Hello"
    },
    onEnter: (text) => {
        console.log('Message sent:', text);
        converter.clear();
    }
});
```

## API Specification

### 1. KeywordMap & EmoticonItem
The `keywordMap` object defines which keywords map to which images and who can see them.

| Property | Type | Description |
| :--- | :--- | :--- |
| `[key: string]` | `EmoticonItem` | The trigger keyword (e.g., `smile` for `:smile:`). |

#### EmoticonItem Object
| Property | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | **(Required)** The absolute or relative URL of the emoticon image. |
| `groups` | `string[]` | *(Optional)* A list of group names that are allowed to use/see this emoticon. |

### 2. Constructor Options (EmoticonTextConverterOptions)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `string` \| `HTMLElement` | `null` | DOM element or selector to use as the editor. |
| `keywordMap` | `KeywordMap` | `{}` | Map of keywords to image URLs and permissions. |
| `emoticonSize` | `number` | `28` | Width and height of the emoticon images (in px). |
| `allowedGroups` | `Record<string, boolean>` | `{}` | A map of groups the current user belongs to (e.g., `{ free: true }`). |
| `placeholder` | `string` | `''` | Placeholder text shown when the editor is empty. |
| `disableEnter` | `boolean` | `false` | If `true`, prevents line breaks via the Enter key. |
| `onInput` | `(text: string) => void` | `undefined` | Fired whenever the text content changes. |
| `onEnter` | `(text: string) => void` | `undefined` | Fired when the Enter key is pressed (unless Shift+Enter is used). |
| `onFocus` | `() => void` | `undefined` | Fired when the editor gains focus. |
| `onBlur` | `() => void` | `undefined` | Fired when the editor loses focus. |

### 3. Methods

- **`getText()`**: Returns the current editor content as plain text including emoticon keywords.
- **`setText(text)`**: Sets specific text in the editor and renders it converted to HTML.
- **`insertText(text)`**: Inserts text at the current cursor position.
- **`addKeyword(key, item)`**: Adds or overwrites an emoticon keyword and re-renders immediately.
- **`removeKeyword(key)`**: Removes a specific emoticon keyword and re-renders immediately.
- **`getKeywordMap()`**: Returns the currently set emoticon map object.
- **`setOptions(options)`**: Dynamically changes options and immediately re-converts the editor content.
- **`getCursorPosition()`**: Returns the logical position of the cursor (treating emoticons/BR as 1 character).
- **`clear()`**: Clears all content in the editor.
- **`getElement()`**: Returns the editor's DOM element.
- **`setReadonly(isReadonly)`**: Dynamically sets the read-only state.
- **`isReadonly()`**: Returns whether the editor is currently in read-only mode.
- **`setEmoticonSize(size)`**: Sets the width/height of emoticons.
- **`getEmoticonSize()`**: Returns the current emoticon size.
- **`setPlaceholder(text)`**: Sets the placeholder text.
- **`getPlaceholder()`**: Returns the current placeholder text.
- **`setDisableEnter(disable)`**: Sets whether the Enter key is disabled.
- **`isDisableEnter()`**: Returns whether the Enter key is disabled.
- **`setAllowedGroups(groups)`**: Sets the map of allowed groups.
- **`getAllowedGroups()`**: Returns the current map of allowed groups.
- **`setGroupAllowed(groupName, isAllowed)`**: Enables or disables a specific group.
- **`setClassPrefix(prefix)`**: Sets the CSS class prefix.
- **`getClassPrefix()`**: Returns the current CSS class prefix.
- **`destroy()`**: Cleans up the instance and removes listeners.

## Development & Testing

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## License

MIT License.
.
