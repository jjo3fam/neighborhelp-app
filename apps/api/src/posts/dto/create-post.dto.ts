export class CreatePostDto {
  title!: string;
  description!: string;
  categoryId!: string;
  postType!: 'need_help' | 'available_for_work';
  priceType!: 'fixed' | 'open_to_offers' | 'accept_offers';
  priceAmount?: number;
  approximateLatitude!: number;
  approximateLongitude!: number;
  approximateLocationName?: string;
  radiusMiles?: number;
}
