import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusMiles?: number;
}
