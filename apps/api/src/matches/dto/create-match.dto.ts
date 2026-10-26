export class CreateMatchDto {
  postId: string;
  posterUserId: string;
  workerUserId: string;
  exactLocationRevealed?: boolean;
}
