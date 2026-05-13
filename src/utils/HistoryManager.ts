import { HistoryState } from '../types';

/**
 * Undo/Redo history manager
 */
export class HistoryManager {
  private stack: HistoryState[] = [];
  private index: number = -1;
  private limit: number;
  private lastPushTime: number = 0;
  private lastPushWasTyping: boolean = false;
  private readonly TYPING_GROUP_THRESHOLD = 500; // ms

  constructor(limit: number = 100) {
    this.limit = limit;
  }

  /**
   * Pushes a new state to the history stack.
   * @param state The state to push
   * @param isTyping Whether this push is from a typing event (to allow grouping)
   */
  public push(state: HistoryState, isTyping: boolean = false): void {
    const now = Date.now();

    if (this.index >= 0) {
      const current = this.stack[this.index];
      
      // If text is same, just update cursor position and return
      if (current.text === state.text) {
        current.cursorPosition = state.cursorPosition;
        return;
      }

      // Grouping logic for typing
      if (isTyping && this.lastPushWasTyping && (now - this.lastPushTime < this.TYPING_GROUP_THRESHOLD)) {
        // Update current top of stack instead of pushing
        current.text = state.text;
        current.cursorPosition = state.cursorPosition;
        this.lastPushTime = now;
        return;
      }
    }

    // Truncate redo stack if we are in the middle
    if (this.index < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.index + 1);
    }

    this.stack.push({ ...state });
    this.lastPushTime = now;
    this.lastPushWasTyping = isTyping;

    if (this.stack.length > this.limit) {
      this.stack.shift();
    } else {
      this.index++;
    }
  }

  /**
   * Returns the previous state.
   */
  public undo(): HistoryState | null {
    if (this.index > 0) {
      this.index--;
      return this.stack[this.index];
    }
    return null;
  }

  /**
   * Returns the next state.
   */
  public redo(): HistoryState | null {
    if (this.index < this.stack.length - 1) {
      this.index++;
      return this.stack[this.index];
    }
    return null;
  }

  /**
   * Clears the history.
   */
  public clear(): void {
    this.stack = [];
    this.index = -1;
    this.lastPushTime = 0;
  }
}
