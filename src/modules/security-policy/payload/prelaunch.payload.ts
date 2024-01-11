import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class PrelaunchPassword {
    @ApiProperty({
      required: true,
    })
    @IsNotEmpty()
    password: string;
  }
  