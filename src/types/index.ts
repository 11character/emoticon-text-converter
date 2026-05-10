export interface EmoticonItem {
  url: string;
  allowedGroups?: string[];
}

export interface KeywordMap {
  [key: string]: EmoticonItem;
}

export interface TextParserOptions {
  keywordMap?: KeywordMap;
  emoticonSize?: number;
  allowedGroups?: Record<string, boolean>;
}

export interface EmoticonTextConverterOptions extends TextParserOptions {
  target?: string | HTMLElement | null;
  placeholder?: string;
  onEnter?: (text: string) => void;
  onInput?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disableEnter?: boolean;
}

export interface EmoticonConverterState {
  text: string;
  isKeyDown: boolean;
  isConverting: boolean;
  isImeInput: boolean;
  isComposition: boolean;
  isDownShift: boolean;
  isDownCtrl: boolean;
  isDownAlt: boolean;
  isDownMeta: boolean;
}

declare global {
  interface Event {
    // _isETC 플래그는 더 이상 사용되지 않습니다 (콜백 방식으로 전환)
  }
}
