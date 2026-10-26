export class UpdatePostDto {
  title?: string;
  description?: string;
  categoryId?: string;
  postType?: 'need_help' | 'available_for_work';
  priceType?: 'fixed' | 'open_to_offers' | 'accept_offers';
  priceAmount?: number;
  status?: string;
}
