import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Clients may not change status, owner or locations through this DTO. */
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;
}
