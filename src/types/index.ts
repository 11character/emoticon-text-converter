export interface EmoticonItem {
  url: string;
  useLevel?: number;
}

export interface KeywordMap {
  [key: string]: EmoticonItem;
}

export interface TextParserOptions {
  keywordMap?: KeywordMap;
  emoticonSize?: number;
  userEmoticonLevel?: number;
}

export interface EmoticonTextConverterOptions extends TextParserOptions {
  target?: string | HTMLElement | null;
  placeholder?: string;
  onEnter?: (text: string) => void;
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
    _isETC?: boolean;
  }
}
