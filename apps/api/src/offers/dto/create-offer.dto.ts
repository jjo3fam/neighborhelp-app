import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOfferDto {
  @IsUUID()
  postId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
