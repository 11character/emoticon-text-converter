import { KeywordMap, TextParserOptions } from '../types';

/**
 * 이모티콘 키워드와 HTML 간의 변환을 담당하는 클래스
 */
export class TextParser {
  private keywordMap: KeywordMap;
  private emoticonSize: number;
  private allowedGroups: Record<string, boolean>;

  /**
   * @param {TextParserOptions} options
   */
  constructor(options: TextParserOptions = {}) {
    this.keywordMap = options.keywordMap || {};
    this.emoticonSize = options.emoticonSize || 28;
    this.allowedGroups = options.allowedGroups || {};
  }

  /**
   * 텍스트 내의 이모티콘 키워드를 <img> 태그로 변환합니다.
   * @param {string} text 
   * @returns {string} HTML string
   */
  toHtml(text: string): string {
    if (!text) return '';

    // 1. 특수문자 엔티티화 (XSS 방지 및 텍스트 보존)
    let html = this.escapeHtml(text);

    // 2. 줄바꿈을 <br>로 변환
    html = html.replace(/\r?\n/g, '<br>');

    // 3. 키워드 변환 (:keyword: -> <img>)
    const splitArr = text.split(':');
    const matchKeySet = new Set<string>();

    splitArr.forEach((key) => {
      const emoticon = this.keywordMap[key];
      if (emoticon) {
        // 권한 체크: groups가 없으면 전체 공개, 있으면 해당 그룹 포함 여부 확인
        const isAllowed = !emoticon.groups || 
                         emoticon.groups.some(group => this.allowedGroups[group]);
        
        if (isAllowed) {
          matchKeySet.add(key);
        }
      }
    });

    matchKeySet.forEach((key) => {
      const htmlKey = this.escapeHtml(key);
      const escapedKey = htmlKey.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const emoticon = this.keywordMap[key];
      if (emoticon) {
        const safeUrl = this.escapeAttribute(emoticon.url);
        const safeKey = this.escapeAttribute(key);
        const imgHtml = `<img src="${safeUrl}" style="display:inline; pointer-events: none;" width="${this.emoticonSize}" height="${this.emoticonSize}" alt=":${safeKey}:" />`;
        
        // 전역 매칭을 통해 모든 인스턴스 교체
        html = html.replace(new RegExp(`:${escapedKey}:`, 'gi'), imgHtml);
      }
    });

    return html;
  }

  /**
   * 텍스트를 HTML 엔티티로 변환합니다.
   */
  private escapeHtml(str: string): string {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
  }

  /**
   * HTML 속성 값 내의 큰따옴표를 이스케이프합니다.
   */
  private escapeAttribute(str: string): string {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  /**
   * DOM 요소의 내용을 텍스트로 역변환합니다.
   * <img>는 :keyword:로, <br>은 \n으로 변환합니다.
   * @param {Node} element 
   * @returns {string} Plain text
   */
  toText(element: Node): string {
    if (!element) return '';
    
    let text = '';
    const childNodes = element.childNodes;

    childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += (node as Text).textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.nodeName.toLowerCase();
        if (tagName === 'br') {
          text += '\n';
        } else if (tagName === 'img') {
          const alt = (node as Element).getAttribute('alt');
          text += alt || '';
        } else {
          // 중첩된 요소가 있을 경우 재귀적으로 텍스트 추출
          text += this.toText(node);
        }
      }
    });

    return text;
  }
}
