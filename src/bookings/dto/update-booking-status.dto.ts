import { IsEnum } from "class-validator";
import { BookingStatus } from "src/generated/prisma/enums";

export class UpdateBookingStatusDto {
    @IsEnum(BookingStatus)
    status: BookingStatus;
}