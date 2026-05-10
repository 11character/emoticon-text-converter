import { describe, it, expect, beforeEach } from 'vitest';
import { TextParser } from './TextParser';
import { KeywordMap } from '../types';

describe('TextParser', () => {
  let parser: TextParser;
  const mockKeywordMap: KeywordMap = {
    'smile': { url: 'smile.png', useLevel: 0 },
    'heart': { url: 'heart.png', useLevel: 1 },
    'star': { url: 'star.png', useLevel: 5 }
  };

  beforeEach(() => {
    parser = new TextParser({
      keywordMap: mockKeywordMap,
      emoticonSize: 30,
      userEmoticonLevel: 1
    });
  });

  describe('toHtml', () => {
    it('일반 텍스트를 그대로 반환해야 한다 (엔티티 처리 포함)', () => {
      const input = 'Hello <world>';
      expect(parser.toHtml(input)).toBe('Hello &lt;world&gt;');
    });

    it('줄바꿈을 <br>로 변환해야 한다', () => {
      const input = 'Line 1\nLine 2';
      expect(parser.toHtml(input)).toBe('Line 1<br>Line 2');
    });

    it('권한이 있는 이모티콘 키워드를 <img> 태그로 변환해야 한다', () => {
      const input = 'I love :smile: and :heart:';
      const output = parser.toHtml(input);
      expect(output).toContain('<img src="smile.png"');
      expect(output).toContain('alt=":smile:"');
      expect(output).toContain('<img src="heart.png"');
      expect(output).toContain('width="30"');
    });

    it('권한이 없는 이모티콘 키워드는 변환하지 않아야 한다', () => {
      const input = 'Check this :star:';
      expect(parser.toHtml(input)).toBe('Check this :star:');
    });

    it('존재하지 않는 키워드는 변환하지 않아야 한다', () => {
      const input = 'Unknown :ghost:';
      expect(parser.toHtml(input)).toBe('Unknown :ghost:');
    });

    it('동일한 이모티콘이 여러 번 나타나도 모두 변환해야 한다', () => {
      const input = ':smile: :smile:';
      const output = parser.toHtml(input);
      const matches = output.match(/<img/g);
      expect(matches).toHaveLength(2);
    });

    it('빈 문자열 입력 시 빈 문자열을 반환해야 한다', () => {
      expect(parser.toHtml('')).toBe('');
    });
  });

  describe('toText', () => {
    it('HTML 요소를 텍스트로 역변환해야 한다', () => {
      const container = document.createElement('div');
      container.innerHTML = 'Hello<br>World <img src="smile.png" alt=":smile:">';
      
      expect(parser.toText(container)).toBe('Hello\nWorld :smile:');
    });

    it('연속된 이미지를 텍스트로 올바르게 변환해야 한다', () => {
      const container = document.createElement('div');
      container.innerHTML = '<img src="smile.png" alt=":smile:"><img src="heart.png" alt=":heart:">';
      expect(parser.toText(container)).toBe(':smile::heart:');
    });

    it('중첩된 요소의 텍스트도 추출해야 한다', () => {
      const container = document.createElement('div');
      container.innerHTML = 'Parent <span>Child</span>';
      expect(parser.toText(container)).toBe('Parent Child');
    });
  });
});
