import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Sender and receiver are derived server-side; clients cannot set them. */
export class CreateMessageDto {
  @IsUUID()
  postId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
