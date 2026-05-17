import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CursorManager } from './CursorManager';

describe('CursorManager', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.setAttribute('contenteditable', 'true');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('getCursorPosition', () => {
    it('텍스트만 있는 경우 위치를 정확히 반환해야 한다', () => {
      container.textContent = 'Hello';
      const textNode = container.firstChild as Text;
      
      const range = document.createRange();
      range.setStart(textNode, 2); // 'He|llo'
      range.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      expect(CursorManager.getCursorPosition(container)).toBe(2);
    });

    it('이미지(이모티콘)를 1글자로 취급하여 위치를 반환해야 한다', () => {
      container.innerHTML = 'A<img src="test.png" alt=":smile:">B';
      // 구조: [Text("A"), Img, Text("B")]
      const textNodeB = container.childNodes[2] as Text;
      
      const range = document.createRange();
      range.setStart(textNodeB, 1); // 'A(img)B|' -> 위치 3
      range.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      expect(CursorManager.getCursorPosition(container)).toBe(3);
    });

    it('빈 컨테이너에서 위치 0을 반환해야 한다', () => {
      const range = document.createRange();
      range.setStart(container, 0);
      range.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      expect(CursorManager.getCursorPosition(container)).toBe(0);
    });

    it('줄바꿈(br)이 포함된 경우 위치를 정확히 계산해야 한다', () => {
      container.innerHTML = 'A<br>B';
      const textNodeB = container.childNodes[2] as Text;
      
      const range = document.createRange();
      range.setStart(textNodeB, 0); // 'A\n|B' -> 위치 2
      range.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      expect(CursorManager.getCursorPosition(container)).toBe(2);
    });
  });

  describe('getSelectionRange', () => {
    it('선택 영역이 없는(collapsed) 경우 start와 end가 같아야 한다', () => {
      container.textContent = 'Hello Selection';
      const textNode = container.firstChild as Text;
      
      const range = document.createRange();
      range.setStart(textNode, 6); // 'Hello |Selection'
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const result = CursorManager.getSelectionRange(container);
      expect(result.start).toBe(6);
      expect(result.end).toBe(6);
    });

    it('텍스트 영역이 선택된 경우 논리적 시작과 끝을 정확히 반환해야 한다', () => {
      container.textContent = 'Hello Selection';
      const textNode = container.firstChild as Text;
      
      const range = document.createRange();
      range.setStart(textNode, 6);
      range.setEnd(textNode, 15); // 'Hello [Selection]'
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const result = CursorManager.getSelectionRange(container);
      expect(result.start).toBe(6);
      expect(result.end).toBe(15);
    });

    it('이미지를 포함한 영역이 선택된 경우 위치를 정확히 계산해야 한다', () => {
      container.innerHTML = 'A<img src="test.png">B';
      // 구조: [Text("A"), Img, Text("B")]
      const textA = container.childNodes[0] as Text;
      const textB = container.childNodes[2] as Text;
      
      const range = document.createRange();
      range.setStart(textA, 0); // 시작: 'A' 앞
      range.setEnd(textB, 1);   // 끝: 'B' 뒤
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const result = CursorManager.getSelectionRange(container);
      expect(result.start).toBe(0);
      expect(result.end).toBe(3); // 'A'(1) + img(1) + 'B'(1) = 3
    });
  });

  describe('getLocalOffsetData', () => {
    it('텍스트 노드 내의 위치를 정확히 찾아야 한다', () => {
      container.textContent = 'Hello World';
      const result = CursorManager.getLocalOffsetData(container, 6); // 'World'의 'W' 시작점
      
      expect(result.node.nodeType).toBe(Node.TEXT_NODE);
      expect(result.node.nodeValue).toBe('Hello World');
      expect(result.nodeOffset).toBe(6);
    });

    it('이미지 노드 위치를 정확히 찾아야 한다', () => {
      container.innerHTML = '<img src="test.png">B';
      const result = CursorManager.getLocalOffsetData(container, 0); // <img> 앞
      
      expect(result.node.nodeName.toLowerCase()).toBe('img');
      expect(result.nodeOffset).toBe(0);

      const resultAfter = CursorManager.getLocalOffsetData(container, 1); // <img> 뒤
      expect(resultAfter.node.nodeName.toLowerCase()).toBe('img');
      expect(resultAfter.nodeOffset).toBe(1);
    });
  });

  describe('setCursorPosition', () => {
    it('지정된 오프셋으로 Selection을 이동시켜야 한다', () => {
      container.innerHTML = 'Hi<br>There';
      CursorManager.setCursorPosition(container, 4); // 'Hi\n|T' 위치
      
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        
        // 'There' 텍스트 노드의 시작점이어야 함
        expect(range.startContainer.nodeValue).toBe('There');
        expect(range.startOffset).toBe(1);
      }
    });
  });

  describe('getLineInfos', () => {
    it('단일 줄의 정보를 정확히 반환해야 한다', () => {
      container.innerHTML = 'Hello';
      const lines = CursorManager.getLineInfos(container);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toEqual({ logicalStart: 0, logicalLength: 5 });
    });

    it('여러 줄의 정보를 정확히 반환해야 한다 (br 포함)', () => {
      // A<br>BC<br>D<br> 에서 마지막 br은 더미로 처리
      container.innerHTML = 'A<br>BC<br>D<br>';
      const lines = CursorManager.getLineInfos(container);
      expect(lines).toHaveLength(3);
      expect(lines[0]).toEqual({ logicalStart: 0, logicalLength: 1 }); // 'A'
      expect(lines[1]).toEqual({ logicalStart: 2, logicalLength: 2 }); // 'BC'
      expect(lines[2]).toEqual({ logicalStart: 5, logicalLength: 2 }); // 'D' + 더미 br(1)
    });

    it('이미지가 포함된 줄의 길이를 정확히 계산해야 한다', () => {
      container.innerHTML = 'A<img src="test.png">B<br>C<br>';
      const lines = CursorManager.getLineInfos(container);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toEqual({ logicalStart: 0, logicalLength: 3 }); // 'A(img)B'
      expect(lines[1]).toEqual({ logicalStart: 4, logicalLength: 2 }); // 'C' + 더미 br
    });

    it('연속된 br이 있는 경우 마지막 br만 더미로 처리해야 한다', () => {
      // A<br><br> (2줄: A줄 + 빈 줄)
      container.innerHTML = 'A<br><br>';
      const lines = CursorManager.getLineInfos(container);
      expect(lines).toHaveLength(2);
      expect(lines[0].logicalLength).toBe(1); // 'A'
      expect(lines[1].logicalLength).toBe(1); // 빈 줄의 더미 br
    });
  });
});