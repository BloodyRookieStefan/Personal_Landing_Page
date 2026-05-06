export interface FirefoxBookmark {
  url: string;
  name: string;
  addDate?: number;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}
