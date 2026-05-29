/// <reference types="vite/client" />

declare module 'typo-js' {
  export default class Typo {
    constructor(
      dictionary?: string,
      affData?: string | false,
      wordsData?: string | false,
      settings?: { dictionaryPath?: string },
    );
    check(word: string): boolean;
    suggest(word: string, limit?: number): string[];
  }
}
