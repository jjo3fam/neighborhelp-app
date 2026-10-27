import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsNumber()
  @IsLatitude()
  approximateLatitude!: number;

  @IsNumber()
  @IsLongitude()
  approximateLongitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  approximateLocationName?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  exactLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  exactLongitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  exactLocationLabel?: string;
}
