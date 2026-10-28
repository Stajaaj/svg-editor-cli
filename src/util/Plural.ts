export class Plural {
  static children(count: number): string {
    return count === 1 ? '1 child' : `${count} children`;
  }

  static elements(count: number): string {
    return count === 1 ? '1 element' : `${count} elements`;
  }
}
