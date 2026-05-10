/**
 * contenteditable 요소 내의 커서(Selection/Range) 위치를 관리하는 유틸리티 클래스
 */
export class CursorManager {
  /**
   * 이모티콘(img)과 줄바꿈(br)을 각각 1글자로 취급하여 현재 커서의 논리적 위치를 반환합니다.
   * @param {HTMLElement} root - 대상 contenteditable 요소
   * @returns {number} 논리적 커서 위치 (오프셋)
   */
  static getCursorPosition(root: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const startOffset = range.startOffset;

    let offset = 0;

    // 1. root 자체가 선택된 경우 (자식 노드가 없는 상태 등)
    if (startNode === root && startNode.nodeType !== Node.TEXT_NODE) {
      const nodeArray = Array.from(root.childNodes);
      const previousNodes = nodeArray.slice(0, startOffset);

      return previousNodes.reduce((acc, node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return acc + ((node as Text).nodeValue?.length || 0);
        } else if (
          node.nodeName.toLowerCase() === 'img' ||
          node.nodeName.toLowerCase() === 'br'
        ) {
          return acc + 1;
        }
        return acc;
      }, 0);
    }

    // 2. TreeWalker를 사용한 순회 탐색
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const name = node.nodeName.toLowerCase();
          if (node.nodeType === Node.TEXT_NODE || name === 'img' || name === 'br') {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === startNode) {
        offset += startOffset;
        break;
      }

      if (currentNode.nodeType === Node.TEXT_NODE) {
        offset += (currentNode as Text).nodeValue?.length || 0;
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.nodeName.toLowerCase();
        if (tagName === 'img' || tagName === 'br') {
          offset += 1;
        }
      }
    }

    return offset;
  }

  /**
   * 논리적 오프셋을 바탕으로 실제 DOM 노드와 그 내부의 오프셋 정보를 찾습니다.
   * @param {HTMLElement} el - 대상 요소
   * @param {number} rootOffset - 찾고자 하는 논리적 위치
   * @returns {{node: Node, nodeOffset: number}}
   */
  static getLocalOffsetData(el: HTMLElement, rootOffset: number): { node: Node; nodeOffset: number } {
    let currentOffset = Math.max(0, rootOffset);
    let lastAcceptableNode: Node = el;

    const treeWalker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const name = node.nodeName.toLowerCase();
          if (node.nodeType === Node.TEXT_NODE || name === 'img' || name === 'br') {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let currentNode: Node | null;
    while ((currentNode = treeWalker.nextNode())) {
      lastAcceptableNode = currentNode;
      
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const len = (currentNode as Text).nodeValue?.length || 0;
        if (currentOffset <= len) {
          return { node: currentNode, nodeOffset: currentOffset };
        }
        currentOffset -= len;
      } else {
        // img 또는 br
        if (currentOffset === 0) {
          return { node: currentNode, nodeOffset: 0 };
        }
        currentOffset -= 1;
        // 차감 후 0이 되었다면 현재 노드가 목표 노드임 (특히 img/br 뒤에 커서를 두어야 하는 경우를 위해)
        if (currentOffset === 0) {
            return { node: currentNode, nodeOffset: 1 };
        }
      }
    }

    // 모든 노드를 순회했는데도 남은 오프셋이 있다면 마지막 노드의 끝 반환
    const finalOffset = lastAcceptableNode.nodeType === Node.TEXT_NODE 
        ? ((lastAcceptableNode as Text).nodeValue?.length || 0) 
        : 1;
        
    return { node: lastAcceptableNode, nodeOffset: finalOffset };
  }

  /**
   * 특정 논리적 위치로 커서를 이동시킵니다.
   * @param {HTMLElement} el - 대상 요소
   * @param {number} offset - 이동할 논리적 위치
   */
  static setCursorPosition(el: HTMLElement, offset: number): void {
    const { node: startNode, nodeOffset: startNodeOffset } = this.getLocalOffsetData(el, offset);
    const range = document.createRange();

    if (startNode.nodeType === Node.TEXT_NODE) {
      range.setStart(startNode, startNodeOffset);
    } else {
      // img나 br인 경우
      if (startNodeOffset === 0) {
        range.setStartBefore(startNode);
      } else {
        range.setStartAfter(startNode);
      }
    }

    range.collapse(true);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
