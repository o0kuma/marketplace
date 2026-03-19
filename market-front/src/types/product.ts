export type ProductStatus = "ON_SALE" | "SOLD_OUT" | "DELETED";

export interface OptionValueResponse {
  id: number;
  name: string;
  sortOrder: number;
}

export interface OptionGroupResponse {
  id: number;
  name: string;
  sortOrder: number;
  values: OptionValueResponse[];
}

export interface ProductVariantResponse {
  id: number;
  price: number;
  stockQuantity: number;
  sku?: string | null;
  optionSummary?: string | null;
  /** Backend uses Long; JSON may deserialize as number or string — compare with numeric coercion on the client. */
  optionValueIds?: (number | string)[];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  /** Ordered gallery image URLs. When empty, use imageUrl as single image. */
  imageUrls?: string[];
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  sellerId: number;
  sellerName: string;
  categoryId?: number | null;
  categoryName?: string | null;
  optionGroups?: OptionGroupResponse[];
  variants?: ProductVariantResponse[];
}

/** Request body: option group for product create/update */
export interface OptionGroupInput {
  name: string;
  sortOrder: number;
  values: { name: string; sortOrder: number }[];
}

/** Request body: variant for product create/update. optionValueNames order = optionGroups order */
export interface ProductVariantInput {
  price: number;
  stockQuantity: number;
  sku?: string | null;
  optionValueNames: string[];
}

export interface ProductListResponse {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
