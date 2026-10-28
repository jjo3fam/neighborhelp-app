import { IsOptional, IsUUID } from 'class-validator';

export class MessageQueryDto {
  @IsOptional()
  @IsUUID()
  before?: string;
}
