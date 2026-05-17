import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmoticonTextConverter } from './EmoticonTextConverter';
import { CursorManager } from '../utils/CursorManager';
import { KeywordMap } from '../types';

describe('EmoticonTextConverter', () => {
  let converter: EmoticonTextConverter;
  let target: HTMLElement;
  const keywordMap: KeywordMap = {
    smile: { url: 'smile.png' },
    heart: { url: 'heart.png' },
    star: { url: 'star.png', groups: ['vip'] }
  };

  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    target = document.getElementById('editor') as HTMLElement;
    converter = new EmoticonTextConverter({
      target,
      keywordMap,
      emoticonSize: 20,
      allowedGroups: { 'vip': false }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should throw error if target element is not a div', () => {
      document.body.innerHTML = '<span id="invalid-editor"></span>';
      const spanTarget = document.getElementById('invalid-editor') as HTMLElement;
      expect(() => new EmoticonTextConverter({ target: spanTarget })).toThrow('[EmoticonTextConverter] Target element must be a <div> element.');
    });

    it('should throw error if target selector does not exist', () => {
      expect(() => new EmoticonTextConverter({ target: '#non-existent' })).toThrow('[EmoticonTextConverter] Target element not found for selector: #non-existent');
    });

    it('should initialize with a div element selector', () => {
      document.body.innerHTML = '<div id="valid-editor"></div>';
      const divConverter = new EmoticonTextConverter({ target: '#valid-editor' });
      expect(divConverter.getElement().tagName).toBe('DIV');
    });

    it('should create a div element if no target is provided', () => {
      const noTargetConverter = new EmoticonTextConverter();
      expect(noTargetConverter.getElement().tagName).toBe('DIV');
    });

    it('should initialize correctly with default classes', () => {
      expect(converter.getElement()).toBe(target);
      expect(target.getAttribute('contenteditable')).toBe('true');
      expect(target.classList.contains('etc-container')).toBe(true);
    });
  });

  it('should set and get text correctly', () => {
    converter.setText('Hello :smile:');
    expect(converter.getText()).toBe('Hello :smile:');
    expect(target.innerHTML).toContain('img');
    expect(target.innerHTML).toContain('smile.png');
  });

  it('should clear text', () => {
    converter.setText('Some text');
    converter.clear();
    expect(converter.getText()).toBe('');
    expect(target.innerHTML).toBe('');
  });

  it('should return correct original and converted text lengths', () => {
    converter.setText('hello');
    expect(converter.getOriginalTextLength()).toBe(5);
    expect(converter.getConvertedTextLength()).toBe(5);

    converter.setText('a:smile:b');
    expect(converter.getOriginalTextLength()).toBe(9);
    expect(converter.getConvertedTextLength()).toBe(3);

    converter.setText(':star:');
    expect(converter.getOriginalTextLength()).toBe(6);
    expect(converter.getConvertedTextLength()).toBe(6);
  });

  it('should insert text at cursor position', () => {
    converter.setText('World');
    converter.insertText('Hello ');
    expect(converter.getText()).toBe('Hello World');
  });

  it('should replace selected text with new text', () => {
    converter.setText('Hello Beautiful World');
    
    // "Beautiful"의 논리적 오프셋은 6부터 15까지입니다.
    const { node: startNode, nodeOffset: startOffset } = CursorManager.getLocalOffsetData(target, 6);
    const { node: endNode, nodeOffset: endOffset } = CursorManager.getLocalOffsetData(target, 15);
    
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    converter.insertText('Small');
    expect(converter.getText()).toBe('Hello Small World');
  });

  it('should insert text correctly after an emoticon', () => {
    converter.setText('A :smile: B');
    CursorManager.setCursorPosition(target, 3);
    
    converter.insertText('!');
    expect(converter.getText()).toBe('A :smile:! B');
  });

  it('should trigger conversion when typing keywords', async () => {
    const onInput = vi.fn();
    converter.setOptions({ onInput });
    
    target.innerHTML = 'Hello :smile:';
    target.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalled();
    
    target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
    expect(target.innerHTML).toContain('img');
  });

  it('should respect disableEnter option', () => {
    const newTarget = document.createElement('div');
    document.body.appendChild(newTarget);
    
    const disableEnterConverter = new EmoticonTextConverter({
      target: newTarget,
      disableEnter: true
    });

    disableEnterConverter.setText('Line 1');
    CursorManager.setCursorPosition(newTarget, 6);
    
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    newTarget.dispatchEvent(event);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(disableEnterConverter.getText()).not.toContain('\n');
    
    document.body.removeChild(newTarget);
  });

  it('should insert a line break on Enter key when disableEnter is false (default)', () => {
    converter.setText('Line 1');
    CursorManager.setCursorPosition(target, 6);
    
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    
    expect(target.querySelectorAll('br').length).toBeGreaterThanOrEqual(1);
    expect(converter.getText()).toContain('\n');
  });

  it('should handle pasting text with line breaks', () => {
    const clipboardData = {
      getData: (type: string) => type === 'text/plain' ? 'Line 1\nLine 2' : '',
    };
    const event = new CustomEvent('paste', { bubbles: true, cancelable: true }) as any;
    event.clipboardData = clipboardData;
    event.preventDefault = vi.fn();
    
    target.dispatchEvent(event);
    
    expect(converter.getText()).toBe('Line 1\nLine 2');
    expect(target.innerHTML).toContain('<br>');
  });

  it('should handle drop event by inserting only plain text', () => {
    const dataTransfer = {
      getData: (type: string) => {
        if (type === 'text/plain') return 'Dropped Text';
        if (type === 'text/html') return '<img src="x" onerror="alert(1)">';
        return '';
      },
    };
    const event = new CustomEvent('drop', { bubbles: true, cancelable: true }) as any;
    event.dataTransfer = dataTransfer;
    event.preventDefault = vi.fn();
    
    target.dispatchEvent(event);
    
    expect(converter.getText()).toBe('Dropped Text');
    expect(target.innerHTML).not.toContain('img');
    expect(event.preventDefault).toHaveBeenCalled();
  });

  describe('Vertical Cursor Movement', () => {
    it('상하 방향키 입력 시 논리적 컬럼을 유지하며 이동해야 한다', () => {
      converter.setText('A:smile:B\nC:heart:D\nE');
      
      CursorManager.setCursorPosition(target, 3);
      expect(CursorManager.getCursorPosition(target)).toBe(3);

      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(7);

      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(3);
    });

    it('이동할 줄이 현재보다 짧은 경우 해당 줄의 끝으로 이동해야 한다', () => {
      converter.setText('LongLine\nShort');
      CursorManager.setCursorPosition(target, 8);
      
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(14);
    });

    it('짧은 줄을 거쳐 다시 긴 줄로 갈 때 원래 컬럼을 유지해야 한다 (desiredColumn)', () => {
      converter.setText('123456\nA\nabcdef');
      CursorManager.setCursorPosition(target, 6);
      
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(8);

      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(15);
    });

    it('첫 줄에서 위로 가거나 마지막 줄에서 아래로 가도 위치가 변하지 않아야 한다', () => {
      converter.setText('Line 1\nLine 2');

      // 첫 줄 중간
      CursorManager.setCursorPosition(target, 3);
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(3); // 위치 유지

      // 마지막 줄 중간 (위치 7 + 3 = 10)
      CursorManager.setCursorPosition(target, 10);
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(CursorManager.getCursorPosition(target)).toBe(10); // 위치 유지
    });
  });

  it('should handle consecutive emoticons', () => {
    converter.setText(':smile::heart:');
    expect(converter.getText()).toBe(':smile::heart:');
    const images = target.querySelectorAll('img');
    expect(images.length).toBe(2);
  });

  it('should maintain the logical cursor position when allowedGroups changes and triggers re-render', () => {
    const keywordMap: KeywordMap = {
      vip: { url: 'vip.png', groups: ['vip'] }
    };
    const groupConverter = new EmoticonTextConverter({
      target,
      keywordMap,
      allowedGroups: { 'vip': false }
    });

    groupConverter.setText('Hello :vip: world');
    CursorManager.setCursorPosition(target, 12);
    
    groupConverter.setOptions({ allowedGroups: { 'vip': true } });
    
    expect(target.innerHTML).toContain('img');
    expect(CursorManager.getCursorPosition(target)).toBe(8);

    groupConverter.setOptions({ allowedGroups: { 'vip': false } });
    
    expect(target.innerHTML).not.toContain('img');
    expect(CursorManager.getCursorPosition(target)).toBe(12);
  });

  it('should handle empty container and placeholder correctly', () => {
    const phConverter = new EmoticonTextConverter({
      target,
      placeholder: 'Type something...'
    });
    
    expect(target.getAttribute('data-placeholder')).toBe('Type something...');
    expect(target.classList.contains('etc-empty')).toBe(true);
    
    phConverter.setText('A');
    expect(target.classList.contains('etc-empty')).toBe(false);
    
    phConverter.clear();
    expect(target.classList.contains('etc-empty')).toBe(true);
  });

  describe('Read-Only Mode', () => {
    it('should initialize with readonly mode correctly', () => {
      const readonlyConverter = new EmoticonTextConverter({
        target,
        readonly: true
      });
      expect(target.getAttribute('contenteditable')).toBe('false');
      expect(target.getAttribute('aria-readonly')).toBe('true');
      expect(target.classList.contains('etc-read-only')).toBe(true);
    });

    it('should toggle readonly mode dynamically using setReadonly', () => {
      converter.setReadonly(true);
      expect(target.getAttribute('contenteditable')).toBe('false');
      expect(target.getAttribute('aria-readonly')).toBe('true');
      expect(target.classList.contains('etc-read-only')).toBe(true);

      converter.setReadonly(false);
      expect(target.getAttribute('contenteditable')).toBe('true');
      expect(target.getAttribute('aria-readonly')).toBeNull();
      expect(target.classList.contains('etc-read-only')).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should return current options via getOptions', () => {
      const options = converter.getOptions();
      expect(options).toHaveProperty('keywordMap');
    });

    it('should return current keywordMap via getKeywordMap', () => {
      const map = converter.getKeywordMap();
      expect(map).toHaveProperty('heart');
      expect(map.heart.url).toBe('heart.png');
    });
  });
});