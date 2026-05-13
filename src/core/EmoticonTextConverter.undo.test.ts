import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmoticonTextConverter } from './EmoticonTextConverter';
import { KeywordMap } from '../types';

describe('EmoticonTextConverter Undo/Redo', () => {
  let converter: EmoticonTextConverter;
  let target: HTMLElement;
  const keywordMap: KeywordMap = {
    smile: { url: 'smile.png' }
  };

  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    target = document.getElementById('editor') as HTMLElement;
    converter = new EmoticonTextConverter({
      target,
      keywordMap
    });
  });

  it('should undo and redo using keyboard shortcuts (Ctrl+Z / Ctrl+Y)', () => {
    converter.setText('State 1');
    converter.setText('State 2');

    expect(converter.getText()).toBe('State 2');

    // Undo: Ctrl+Z
    const undoEvent = new KeyboardEvent('keydown', { 
      key: 'z', 
      ctrlKey: true, 
      bubbles: true, 
      cancelable: true 
    });
    target.dispatchEvent(undoEvent);
    expect(converter.getText()).toBe('State 1');

    // Redo: Ctrl+Y
    const redoEvent = new KeyboardEvent('keydown', { 
      key: 'y', 
      ctrlKey: true, 
      bubbles: true, 
      cancelable: true 
    });
    target.dispatchEvent(redoEvent);
    expect(converter.getText()).toBe('State 2');
  });

  it('should undo and redo using Mac shortcuts (Cmd+Z / Cmd+Shift+Z)', () => {
    converter.setText('State A');
    converter.setText('State B');

    // Undo: Cmd+Z
    const undoEvent = new KeyboardEvent('keydown', { 
      key: 'z', 
      metaKey: true, 
      bubbles: true, 
      cancelable: true 
    });
    target.dispatchEvent(undoEvent);
    expect(converter.getText()).toBe('State A');

    // Redo: Cmd+Shift+Z
    const redoEvent = new KeyboardEvent('keydown', { 
      key: 'z', 
      metaKey: true, 
      shiftKey: true, 
      bubbles: true, 
      cancelable: true 
    });
    target.dispatchEvent(redoEvent);
    expect(converter.getText()).toBe('State B');
  });

  it('should undo emoticon conversion correctly', () => {
    converter.setText('Hello');
    
    // Simulate typing ':' to trigger conversion (we'll just call convert for simplicity in test)
    // Actually, let's use insertText which triggers pushHistory
    converter.insertText(' :smile:'); 
    // State 1: "Hello"
    // State 2: "Hello :smile:"
    
    expect(target.innerHTML).toContain('img');
    
    const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    target.dispatchEvent(undoEvent);
    
    expect(converter.getText()).toBe('Hello');
    expect(target.innerHTML).not.toContain('img');
  });

  it('should group typing events', () => {
    // We need to use fake timers to test grouping
    vi.useFakeTimers();
    
    converter.setText(''); // Initial state (State 0)
    
    // Simulate typing 'a', 'b', 'c' with small intervals
    // In test, we manually trigger onInput since JSDOM typing is tricky
    target.innerHTML = 'a';
    target.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(100);
    
    target.innerHTML = 'ab';
    target.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(100);
    
    target.innerHTML = 'abc';
    target.dispatchEvent(new Event('input'));
    
    expect(converter.getText()).toBe('abc');

    // Undo should go back to '' because 'a', 'ab', 'abc' were grouped
    const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    target.dispatchEvent(undoEvent);
    
    expect(converter.getText()).toBe('');
    
    vi.useRealTimers();
  });
});
