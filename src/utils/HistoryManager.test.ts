import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryManager } from './HistoryManager';

describe('HistoryManager', () => {
  let history: HistoryManager;

  beforeEach(() => {
    history = new HistoryManager(5);
    vi.useFakeTimers();
  });

  it('should push states and undo/redo correctly', () => {
    history.push({ text: 'a', cursorPosition: 1 });
    history.push({ text: 'ab', cursorPosition: 2 });
    history.push({ text: 'abc', cursorPosition: 3 });

    expect(history.undo()?.text).toBe('ab');
    expect(history.undo()?.text).toBe('a');
    expect(history.undo()).toBeNull();

    expect(history.redo()?.text).toBe('ab');
    expect(history.redo()?.text).toBe('abc');
    expect(history.redo()).toBeNull();
  });

  it('should truncate redo stack on new push', () => {
    history.push({ text: 'a', cursorPosition: 1 });
    history.push({ text: 'b', cursorPosition: 1 });
    history.push({ text: 'c', cursorPosition: 1 });

    history.undo(); // back to b
    history.push({ text: 'd', cursorPosition: 1 });

    expect(history.redo()).toBeNull();
    expect(history.undo()?.text).toBe('b');
  });

  it('should respect the limit', () => {
    history.push({ text: '1', cursorPosition: 1 });
    history.push({ text: '2', cursorPosition: 2 });
    history.push({ text: '3', cursorPosition: 3 });
    history.push({ text: '4', cursorPosition: 4 });
    history.push({ text: '5', cursorPosition: 5 });
    history.push({ text: '6', cursorPosition: 6 });

    // Should contain 2, 3, 4, 5, 6
    expect(history.undo()?.text).toBe('5');
    history.undo();
    history.undo();
    history.undo();
    expect(history.undo()).toBeNull(); // Reached '2', no more undo
  });

  it('should group typing states within threshold', () => {
    history.push({ text: 'h', cursorPosition: 1 }, true);
    vi.advanceTimersByTime(100);
    history.push({ text: 'he', cursorPosition: 2 }, true);
    vi.advanceTimersByTime(100);
    history.push({ text: 'hel', cursorPosition: 3 }, true);

    // Should only have one state 'hel' (and initial state if any)
    // In this case, 'hel' replaced 'h' then 'he'
    expect(history.undo()).toBeNull(); // No previous state because we pushed 'h' then updated it twice
    
    // Wait, the first push always creates a state.
    // Let's re-test with an initial state.
    history.clear();
    history.push({ text: '', cursorPosition: 0 }); // Initial
    history.push({ text: 'h', cursorPosition: 1 }, true);
    vi.advanceTimersByTime(100);
    history.push({ text: 'he', cursorPosition: 2 }, true);
    
    expect(history.undo()?.text).toBe('');
  });

  it('should NOT group typing states beyond threshold', () => {
    history.push({ text: '', cursorPosition: 0 });
    history.push({ text: 'h', cursorPosition: 1 }, true);
    vi.advanceTimersByTime(600); // Beyond 500ms
    history.push({ text: 'he', cursorPosition: 2 }, true);

    expect(history.undo()?.text).toBe('h');
    expect(history.undo()?.text).toBe('');
  });

  it('should NOT group states if isTyping is false', () => {
    history.push({ text: '', cursorPosition: 0 });
    history.push({ text: 'h', cursorPosition: 1 }, false);
    vi.advanceTimersByTime(100);
    history.push({ text: 'he', cursorPosition: 2 }, false);

    expect(history.undo()?.text).toBe('h');
  });
});
