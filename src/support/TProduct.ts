export type TProduct = {
  productPageUrl: string;
  productSku: string;
  manufacturerName: string | null;
  manufacturerSku: string | null;
  name: string;
  saleUnit: string | null;
  imageUrl: string | null;
  category: string[];
  description: string[];
  specs: { [key: string]: string };
  variationProductPageUrls: string[];
};
