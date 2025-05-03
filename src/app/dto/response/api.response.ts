export interface ApiResponse<T> {
  code: number;
  message: string | null;
  result: T;

}
