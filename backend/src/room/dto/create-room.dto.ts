export class CreateRoomDto {
  roomNumber: string;
  price: number;
  area: number;
  propertyId: string; // Bắt buộc phải truyền ID của Khu trọ vào đây
}
