declare global {
  export namespace chrome {
    export class identity {
      public static getAuthToken(option?: { interactive: boolean }, callback?: (token: string) => void): void;
    }
  }
}
export type x = ""
