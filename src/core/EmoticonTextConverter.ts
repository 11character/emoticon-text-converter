import { TextParser } from '../parser/TextParser';
import { CursorManager } from '../utils/CursorManager';
import { HistoryManager } from '../utils/HistoryManager';
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
  private history!: HistoryManager;

  private options: EmoticonTextConverterOptions = {
    target: null,
    keywordMap: {},
    emoticonSize: 28,
    allowedGroups: {},
    placeholder: '',
    onEnter: () => {},
    onInput: () => {},
    onFocus: () => {},
    onBlur: () => {},
    disableEnter: false,
    readonly: false,
    classPrefix: 'etc-',
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
    this.history = new HistoryManager();
    this.setOptions(options);
    this.initParser();
    this.initElement();
    this.bindEvents();
    
    // 초기 상태 저장
    this.pushHistory(false);
  }

  /* -------------------------------------------------------------------------- */
  /*  1. Core & Element Methods                                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * 에디터 요소를 반환합니다.
   * @returns {HTMLElement}
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 모든 리스너를 제거하고 정리합니다.
   */
  public destroy(): void {
    // 필요한 경우 이벤트 리스너 제거 로직 추가
  }

  /* -------------------------------------------------------------------------- */
  /*  2. Option Management                                                      */
  /* -------------------------------------------------------------------------- */

  /**
   * 옵션을 설정하고 기존 옵션과 병합합니다.
   * @param {EmoticonTextConverterOptions} options 
   */
  public setOptions(options: EmoticonTextConverterOptions = {}): void {
    this.options = {
      ...this.options,
      ...options
    };

    // 옵션이 변경되면 파서를 재초기화합니다.
    this.initParser();

    // 에디터가 이미 초기화되어 있다면 내용을 즉시 재변환합니다.
    if (this.element) {
      this.applyReadonlyState();
      this.convert();
    }
  }

  /**
   * 읽기 전용 상태를 설정합니다.
   * @param {boolean} isReadonly 
   */
  public setReadonly(isReadonly: boolean): void {
    this.options.readonly = isReadonly;
    this.applyReadonlyState();
  }

  /**
   * 현재 읽기 전용 상태를 반환합니다.
   * @returns {boolean}
   */
  public isReadonly(): boolean {
    return !!this.options.readonly;
  }

  /**
   * 이모티콘 렌더링 크기를 설정합니다.
   * @param {number} size 
   */
  public setEmoticonSize(size: number): void {
    this.setOptions({ emoticonSize: size });
  }

  /**
   * 현재 이모티콘 렌더링 크기를 반환합니다.
   * @returns {number}
   */
  public getEmoticonSize(): number {
    return this.options.emoticonSize || 28;
  }

  /**
   * 플레이스홀더 텍스트를 설정합니다.
   * @param {string} text 
   */
  public setPlaceholder(text: string): void {
    this.options.placeholder = text;
    this.applyReadonlyState();
  }

  /**
   * 현재 플레이스홀더 텍스트를 반환합니다.
   * @returns {string}
   */
  public getPlaceholder(): string {
    return this.options.placeholder || '';
  }

  /**
   * 엔터키 입력 시 줄바꿈 비활성화 여부를 설정합니다.
   * @param {boolean} disable 
   */
  public setDisableEnter(disable: boolean): void {
    this.options.disableEnter = disable;
  }

  /**
   * 현재 엔터키 줄바꿈 비활성화 여부를 반환합니다.
   * @returns {boolean}
   */
  public isDisableEnter(): boolean {
    return !!this.options.disableEnter;
  }

  /**
   * 허용된 이모티콘 그룹 목록을 설정합니다.
   * @param {Record<string, boolean>} groups 
   */
  public setAllowedGroups(groups: Record<string, boolean>): void {
    this.setOptions({ allowedGroups: groups });
  }

  /**
   * 현재 허용된 이모티콘 그룹 목록을 반환합니다.
   * @returns {Record<string, boolean>}
   */
  public getAllowedGroups(): Record<string, boolean> {
    return this.options.allowedGroups || {};
  }

  /**
   * 특정 그룹의 허용 여부를 설정합니다.
   * @param {string} groupName 
   * @param {boolean} isAllowed 
   */
  public setGroupAllowed(groupName: string, isAllowed: boolean): void {
    const groups = { ...this.getAllowedGroups(), [groupName]: isAllowed };
    this.setAllowedGroups(groups);
  }

  /**
   * CSS 클래스 접두사를 설정합니다.
   * @param {string} prefix 
   */
  public setClassPrefix(prefix: string): void {
    const oldPrefix = this.options.classPrefix;
    this.options.classPrefix = prefix;
    
    if (this.element && oldPrefix !== prefix) {
      // 기존 클래스 제거 및 새 클래스 적용을 위해 상태 재적용
      if (this.options.readonly) {
        this.element.classList.remove(`${oldPrefix}read-only`);
      }
      this.applyReadonlyState();
      this.convert();
    }
  }

  /**
   * 현재 설정된 CSS 클래스 접두사를 반환합니다.
   * @returns {string}
   */
  public getClassPrefix(): string {
    return this.options.classPrefix || 'etc-';
  }

  /* -------------------------------------------------------------------------- */
  /*  3. Content Management                                                     */
  /* -------------------------------------------------------------------------- */

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
    this.pushHistory(false);
  }

  /**
   * 에디터 내용을 비웁니다.
   */
  public clear(): void {
    this.element.innerHTML = '';
    this.state.text = '';
    this.options.onInput?.('');
    this.pushHistory(false);
  }

  /**
   * 커서 위치에 텍스트를 삽입합니다.
   */
  public insertText(str: string): void {
    if (this.options.readonly) {
      // 읽기 전용 모드인 경우 커서 위치와 상관없이 마지막에 추가합니다.
      const text = this.getText();
      const newText = text + str;
      this.state.text = newText;
      this.element.innerHTML = this.parser.toHtml(newText);
      this.options.onInput?.(newText);
      this.pushHistory(false);
      return;
    }

    const cursorOffset = CursorManager.getCursorPosition(this.element);
    const text = this.getText();

    const textIndex = this.getOriginalTextIndex(cursorOffset);

    const startText = text.slice(0, textIndex);
    const endText = text.slice(textIndex);

    const newText = `${startText}${str}${endText}`;
    
    this.state.text = newText;
    this.element.innerHTML = this.parser.toHtml(newText);
    
    // 삽입된 문자열을 포함한 앞부분의 새로운 논리적 위치 계산
    const newPos = this.getExpectedLogicalLength(startText + str);
    CursorManager.setCursorPosition(this.element, newPos);
    
    this.options.onInput?.(newText);
    this.pushHistory(false);
  }

  /* -------------------------------------------------------------------------- */
  /*  4. Keyword Management                                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * 현재 설정된 이모티콘 맵 객체를 반환합니다.
   * @returns {KeywordMap}
   */
  public getKeywordMap(): import('../types').KeywordMap {
    return this.options.keywordMap || {};
  }

  /**
   * 새로운 이모티콘 키워드를 맵에 추가하거나 덮어쓰고 즉시 렌더링합니다.
   * @param {string} key 
   * @param {import('../types').EmoticonItem} item 
   */
  public addKeyword(key: string, item: import('../types').EmoticonItem): void {
    const newKeywordMap = {
      ...this.getKeywordMap(),
      [key]: item
    };
    this.setOptions({ keywordMap: newKeywordMap });
  }

  /**
   * 특정 이모티콘 키워드를 맵에서 제거하고 즉시 렌더링합니다.
   * @param {string} key 
   */
  public removeKeyword(key: string): void {
    const keywordMap = this.getKeywordMap();
    if (!(key in keywordMap)) return;
    
    const newKeywordMap = { ...keywordMap };
    delete newKeywordMap[key];
    
    this.setOptions({ keywordMap: newKeywordMap });
  }

  /* -------------------------------------------------------------------------- */
  /*  5. History Management                                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * 이전 상태로 되돌립니다.
   */
  public undo(): void {
    const state = this.history.undo();
    if (state) {
      this.restoreState(state);
    }
  }

  /**
   * 되돌린 상태를 다시 적용합니다.
   */
  public redo(): void {
    const state = this.history.redo();
    if (state) {
      this.restoreState(state);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*  6. Information & Utilities                                                */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*  7. Internal Initialization & Helpers                                      */
  /* -------------------------------------------------------------------------- */

  /**
   * 읽기 전용 옵션에 따라 DOM 속성 및 클래스를 적용합니다.
   */
  private applyReadonlyState(): void {
    if (!this.element) return;

    const { readonly, classPrefix, placeholder } = this.options;
    const readonlyClass = `${classPrefix}read-only`;

    if (readonly) {
      this.element.setAttribute('contenteditable', 'false');
      this.element.setAttribute('aria-readonly', 'true');
      this.element.classList.add(readonlyClass);
      // 읽기 전용일 때는 플레이스홀더를 표시하지 않도록 속성을 제거합니다.
      this.element.removeAttribute('data-placeholder');
    } else {
      this.element.setAttribute('contenteditable', 'true');
      this.element.removeAttribute('aria-readonly');
      this.element.classList.remove(readonlyClass);
      // 일반 모드일 때 플레이스홀더가 설정되어 있다면 속성을 복구합니다.
      if (placeholder) {
        this.element.setAttribute('data-placeholder', placeholder);
      }
    }
  }

  private initParser(): void {
    this.parser = new TextParser({
      keywordMap: this.options.keywordMap,
      emoticonSize: this.options.emoticonSize,
      allowedGroups: this.options.allowedGroups
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

    this.applyReadonlyState();
    this.element.style.outline = 'none';
    this.element.style.overflowWrap = 'anywhere'; // break-all equivalent
  }

  /**
   * 논리적 커서 위치를 바탕으로 원본 텍스트(keyword 포함)에서의 인덱스를 계산합니다.
   * @param {number} logicalOffset 
   * @returns {number}
   */
  private getOriginalTextIndex(logicalOffset: number): number {
    const imgsBefore = this.getImgsBeforeCursor(logicalOffset);
    const correction = imgsBefore.reduce((acc, img) => {
      const alt = img.getAttribute('alt') || '';
      return acc + (alt.length - 1);
    }, 0);

    return logicalOffset + correction;
  }

  /**
   * 특정 텍스트를 변환했을 때 예상되는 논리적 길이를 반환합니다.
   * @param {string} text 
   * @returns {number}
   */
  private getExpectedLogicalLength(text: string): number {
    const html = this.parser.toHtml(text);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return CursorManager.getLogicalLength(temp);
  }

  /**
   * 커서 위치 이전의 모든 IMG 태그를 반환합니다.
   * @param {number} cursorOffset 
   * @returns {HTMLImageElement[]}
   */
  private getImgsBeforeCursor(cursorOffset: number): HTMLImageElement[] {
    const { node, nodeOffset } = CursorManager.getLocalOffsetData(this.element, cursorOffset);
    const range = document.createRange();
    
    range.setStart(this.element, 0);
    
    if (node.nodeType === Node.TEXT_NODE) {
      range.setEnd(node, nodeOffset);
    } else {
      if (nodeOffset === 0) {
        range.setEndBefore(node);
      } else {
        range.setEndAfter(node);
      }
    }

    const fragment = range.cloneContents();
    const temp = document.createElement('div');
    temp.appendChild(fragment);

    return Array.from(temp.querySelectorAll('img')) as HTMLImageElement[];
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
    el.addEventListener('drop', (e: DragEvent) => {
      this.onDrop(e);
    });
    el.addEventListener('beforeinput', (e: InputEvent) => {
      if (e.inputType === 'historyUndo') {
        e.preventDefault();
        this.undo();
      } else if (e.inputType === 'historyRedo') {
        e.preventDefault();
        this.redo();
      }
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

    const isMod = this.state.isDownMeta || this.state.isDownCtrl;
    const isShift = this.state.isDownShift;

    // Undo: Ctrl/Cmd + Z
    if (isMod && !isShift && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.undo();
      return;
    }

    // Redo: Ctrl/Cmd + Shift + Z or Ctrl + Y
    if (
      (isMod && isShift && e.key.toLowerCase() === 'z') || 
      (this.state.isDownCtrl && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault();
      this.redo();
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

    if (key === ':' || key === ';' || key === ' ') {
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
    this.pushHistory(true);
  }

  private onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text/plain');
    if (pastedText) {
      this.insertText(pastedText);
    }
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();
    const droppedText = e.dataTransfer?.getData('text/plain');
    if (droppedText) {
      this.insertText(droppedText);
    }
  }

  private convert(): void {
    this.state.isConverting = true;
    const cursorOffset = CursorManager.getCursorPosition(this.element);
    const text = this.getText();

    // 변환 전 커서 앞부분의 텍스트를 추출하여 변환 후의 논리적 위치를 미리 계산
    const textIndex = this.getOriginalTextIndex(cursorOffset);
    const textBefore = text.slice(0, textIndex);
    const newPos = this.getExpectedLogicalLength(textBefore);

    this.element.innerHTML = this.parser.toHtml(text);
    
    // 보정된 위치로 커서 복구
    CursorManager.setCursorPosition(this.element, newPos);
    
    this.state.isConverting = false;
    this.options.onInput?.(text);
    this.pushHistory(false);
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
    this.pushHistory(false);
  }

  private pushHistory(isTyping: boolean = false): void {
    const text = this.getText();
    const cursorPosition = CursorManager.getCursorPosition(this.element);
    this.history.push({ text, cursorPosition }, isTyping);
  }

  private restoreState(state: { text: string; cursorPosition: number }): void {
    this.state.text = state.text;
    this.element.innerHTML = this.parser.toHtml(state.text);
    CursorManager.setCursorPosition(this.element, state.cursorPosition);
    this.options.onInput?.(state.text);
  }

  private updateStateFromEvent(e: KeyboardEvent): void {
    this.state.isDownShift = e.shiftKey;
    this.state.isDownCtrl = e.ctrlKey;
    this.state.isDownAlt = e.altKey;
    this.state.isDownMeta = e.metaKey;
    this.state.isImeInput = e.isComposing;
  }
}
