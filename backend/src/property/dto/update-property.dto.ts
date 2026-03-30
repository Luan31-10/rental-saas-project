import { PartialType } from '@nestjs/mapped-types';
import { CreateProperty } from './create-property.dto'; // Đổi CreatePropertyDto thành CreateProperty

export class UpdatePropertyDto extends PartialType(CreateProperty) {}
