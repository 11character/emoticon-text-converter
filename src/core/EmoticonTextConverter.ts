import { TextParser } from '../parser/TextParser';
import { CursorManager } from '../utils/CursorManager';
import { 
  EmoticonTextConverterOptions, 
  EmoticonConverterState 
} from '../types';

/**
 * EmoticonTextConverter Core Class
 */
export class EmoticonTextConverter {
  private element!: HTMLElement;
  private parser!: TextParser;

  private options: EmoticonTextConverterOptions = {
    target: null,
    keywordMap: {},
    emoticonSize: 28,
    userEmoticonLevel: 0,
    placeholder: '',
    onEnter: () => {},
    onInput: () => {},
    onFocus: () => {},
    onBlur: () => {},
    disableEnter: false,
  };

  private state: EmoticonConverterState = {
    text: '',
    isKeyDown: false,
    isConverting: false,
    isImeInput: false,
    isComposition: false,
    isDownShift: false,
    isDownCtrl: false,
    isDownAlt: false,
    isDownMeta: false,
  };

  /**
   * @param {EmoticonTextConverterOptions} options 
   */
  constructor(options: EmoticonTextConverterOptions = {}) {
    this.setOptions(options);
    this.initParser();
    this.initElement();
    this.bindEvents();
  }

  /**
   * 옵션을 설정하고 기존 옵션과 병합합니다.
   * @param {EmoticonTextConverterOptions} options 
   */
  public setOptions(options: EmoticonTextConverterOptions = {}): void {
    this.options = {
      ...this.options,
      ...options
    };
  }

  private initParser(): void {
    this.parser = new TextParser({
      keywordMap: this.options.keywordMap,
      emoticonSize: this.options.emoticonSize,
      userEmoticonLevel: this.options.userEmoticonLevel,
    });
  }

  /**
   * 내부 element를 초기화합니다.
   * target이 있으면 해당 요소를 사용하고, 없으면 메모리 상에 div를 생성합니다.
   */
  private initElement(): void {
    if (this.options.target) {
      if (typeof this.options.target === 'string') {
        this.element = document.querySelector(this.options.target) as HTMLElement;
      } else {
        this.element = this.options.target;
      }
    }

    if (!this.element) {
      this.element = document.createElement('div');
    }

    this.element.setAttribute('contenteditable', 'true');
    this.element.style.outline = 'none';
    this.element.style.overflowWrap = 'anywhere'; // break-all equivalent
    
    if (this.options.placeholder) {
      this.element.setAttribute('data-placeholder', this.options.placeholder);
    }
  }

  /**
   * 에디터 요소를 반환합니다.
   * @returns {HTMLElement}
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 현재 텍스트를 반환합니다.
   * @returns {string}
   */
  public getText(): string {
    return this.parser.toText(this.element);
  }

  /**
   * 텍스트를 설정하고 HTML을 갱신합니다.
   * @param {string} text 
   */
  public setText(text: string): void {
    this.state.text = text;
    this.element.innerHTML = this.parser.toHtml(text);
    this.options.onInput?.(text);
  }

  /**
   * 에디터 내용을 비웁니다.
   */
  public clear(): void {
    this.element.innerHTML = '';
    this.state.text = '';
    this.options.onInput?.('');
  }

  /**
   * 원본 텍스트의 길이를 반환합니다. (:keyword: 포함)
   * @returns {number}
   */
  public getOriginalTextLength(): number {
    return this.getText().length;
  }

  /**
   * 변환 후의 논리적 텍스트 길이를 반환합니다. (이모티콘 1글자 취급)
   * @returns {number}
   */
  public getConvertedTextLength(): number {
    return CursorManager.getLogicalLength(this.element);
  }

  /**
   * 현재 커서의 논리적 위치를 반환합니다.
   * @returns {number}
   */
  public getCursorPosition(): number {
    return CursorManager.getCursorPosition(this.element);
  }

  /**
   * 커서 위치에 텍스트를 삽입합니다.
   * @param {string} str 
   */
  public insertText(str: string): void {
    const cursorOffset = CursorManager.getCursorPosition(this.element);
    const text = this.getText();

    const imgsBefore = this.getImgsBeforeCursor(cursorOffset);
    const correction = imgsBefore.reduce((acc, img) => {
      const alt = img.getAttribute('alt') || '';
      return acc + (alt.length - 1);
    }, 0);

    const textIndex = cursorOffset + correction;

    const startText = text.slice(0, textIndex);
    const endText = text.slice(textIndex);

    const newText = `${startText}${str}${endText}`;
    
    this.state.text = newText;
    this.element.innerHTML = this.parser.toHtml(newText);
    
    // Selection 복구를 onInput 호출 전으로 변경 (동기식)
    CursorManager.setCursorPosition(this.element, cursorOffset + str.length);
    
    this.options.onInput?.(newText);
  }

  /**
   * 커서 위치 이전의 모든 IMG 태그를 반환합니다.
   * @param {number} cursorOffset 
   * @returns {HTMLImageElement[]}
   */
  private getImgsBeforeCursor(cursorOffset: number): HTMLImageElement[] {
    const imgs: HTMLImageElement[] = [];
    const { node, nodeOffset } = CursorManager.getLocalOffsetData(this.element, cursorOffset);
    
    if (node.nodeName.toLowerCase() === 'img' && nodeOffset !== 0) {
      imgs.push(node as HTMLImageElement);
    }

    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (n) => n.nodeName.toLowerCase() === 'img' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    );

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) break;
      imgs.push(currentNode as HTMLImageElement);
    }

    return imgs;
  }

  /**
   * 이모티콘을 추가합니다.
   * @param {{key: string, url: string}} emoticon 
   */
  public appendEmoticon(emoticon: { key: string; url: string }): void {
    this.insertText(`:${emoticon.key}:`);
  }

  /**
   * 이벤트 리스너를 바인딩합니다.
   */
  private bindEvents(): void {
    const el = this.element;

    el.addEventListener('keydown', (e: KeyboardEvent) => {
      this.onKeyDown(e);
    });
    el.addEventListener('keyup', (e: KeyboardEvent) => {
      this.onKeyUp(e);
    });
    el.addEventListener('input', (e: Event) => {
      this.onInput(e);
    });
    el.addEventListener('paste', (e: ClipboardEvent) => {
      this.onPaste(e);
    });
    el.addEventListener('focus', () => {
      this.options.onFocus?.();
    });
    el.addEventListener('blur', () => {
      this.options.onBlur?.();
    });
    el.addEventListener('compositionend', () => {
      this.state.isComposition = true;
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.updateStateFromEvent(e);
    this.state.isKeyDown = true;

    if (this.state.isConverting) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      if (!this.state.isImeInput && !this.state.isDownCtrl && !this.state.isDownAlt && !this.state.isDownMeta) {
        // Shift + Enter는 항상 줄바꿈을 허용하고, 일반 Enter는 옵션에 따릅니다.
        const shouldInsertLineBreak = this.state.isDownShift || !this.options.disableEnter;
        
        e.preventDefault();
        if (shouldInsertLineBreak) {
          this.insertLineBreak();
        }
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = e.key;
    this.state.isKeyDown = false;

    const text = this.getText();
    this.state.text = text;

    if (key === ':' || key === ';') {
      this.convert();
    }

    if (key === 'Enter') {
      if (!this.state.isImeInput && !this.state.isDownCtrl && !this.state.isDownAlt && !this.state.isDownMeta) {
        if (!this.state.isDownShift && !this.state.isComposition) {
          this.options.onEnter?.(text);
        }
      }
    }

    this.state.isComposition = false;
    this.updateStateFromEvent(e);
  }

  private onInput(e: Event): void {
    this.state.text = this.getText();
    this.options.onInput?.(this.state.text);
  }

  private onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text/plain');
    if (pastedText) {
      this.insertText(pastedText);
    }
  }

  private convert(): void {
    this.state.isConverting = true;
    const cursorOffset = CursorManager.getCursorPosition(this.element);
    const text = this.getText();

    this.element.innerHTML = this.parser.toHtml(text);
    
    // Selection 복구를 동기식으로 수행
    CursorManager.setCursorPosition(this.element, cursorOffset);
    
    this.state.isConverting = false;
    
    // 변환 후에도 텍스트가 바뀐 것으로 간주하여 onInput 호출 (선택 사항이나 데모 정합성을 위해 추가)
    this.options.onInput?.(text);
  }

  private insertLineBreak(): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const lastChild = this.element.lastChild;
    if (!lastChild || lastChild.nodeName.toLowerCase() !== 'br') {
      this.element.appendChild(document.createElement('br'));
    }

    const range = selection.getRangeAt(0);
    const br = document.createElement('br');

    range.deleteContents();
    range.insertNode(br);

    range.setStartAfter(br);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    this.state.text = this.getText();
    this.options.onInput?.(this.state.text);
  }

  private updateStateFromEvent(e: KeyboardEvent): void {
    this.state.isDownShift = e.shiftKey;
    this.state.isDownCtrl = e.ctrlKey;
    this.state.isDownAlt = e.altKey;
    this.state.isDownMeta = e.metaKey;
    this.state.isImeInput = e.isComposing;
  }

  public destroy(): void {
    // Cleanup logic
  }
}
