import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Backend Engineering' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;
}
