import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOrderDto {
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
