import { z } from 'zod';

export const stockDetailSchema = z.object({
  stockId: z.number().min(1),
  htmlDescription: z.string().min(1, 'stock.detail.htmlDescription.required'),
});

export const stockRelationSchema = z.object({
  stockId: z.number().min(1),
  relatedStockId: z.number().min(1, 'stock.relations.relatedStock.required'),
  quantity: z.number().positive('stock.relations.quantity.positive'),
  description: z.string().optional(),
  isMandatory: z.boolean(),
});

export type StockDetailFormSchema = z.infer<typeof stockDetailSchema>;
export type StockRelationFormSchema = z.infer<typeof stockRelationSchema>;
