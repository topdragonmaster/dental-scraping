export type TProduct = {
  productPageUrl: string;
  productSku: string | undefined;
  manufacturerName: string | null | undefined;
  manufacturerSku: string | null | undefined;
  name: string | undefined;
  saleUnit: string | null;
  imageUrl: string | null | undefined;
  category: string[];
  description: string[];
  specs: { [key: string]: string };
  variationProductPageUrls: TVariationProductPageUrl[];
};

export type TVariationProductPageUrl = string | undefined