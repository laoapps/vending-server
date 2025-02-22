interface Array<T> {
  find(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T | undefined;
  findIndex(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): number;
  includes(searchElement: T, fromIndex?: number): boolean

}
// src/typings.d.ts
interface ObjectConstructor {
  entries<T>(obj: { [key: string]: T }): [string, T][]
}
// src/typings.d.ts
interface String {
  startsWith(search: string, pos?: number): boolean;
  endsWith(search: string, endPosition?: number): boolean;
  includes(search: string, start?: number): boolean;
  repeat(count: number): string;
  padStart(maxLength: number, fillString?: string): string;
  padEnd(maxLength: number, fillString?: string): string
}
