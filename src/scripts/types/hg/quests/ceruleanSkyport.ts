import { z } from 'zod';

export const shipmentType = ['gas_shipment', 'cloudstone_shipment', 'spice_shipment'] as const;
const shipmentTypeEnum = z.enum(shipmentType);

const currentShipmentSchema = z.object({
    type: shipmentTypeEnum,
    name: z.string(),
    location: z.object({
        name: z.string(),
    })
});

export const raidType = [
    'tribal_isles_raid',
    'fiery_warpath_raid',
    'living_garden_raid',
    'fort_rox_raid',
    'queso_geyser_raid',
    'zokor_raid',
    'moussu_picchu_raid',
    'floating_islands_raid',
    'table_of_contents_raid',
] as const;
const raidTypeEnum = z.enum(raidType);

const currentRaidSchema = z.object({
    type: raidTypeEnum,
    name: z.string()
});

const baseCeruleanSkyportQuestSchema = z.object({
    is_shipping: z.literal(false),
    is_intercepting: z.literal(false),
    current_shipment: z.tuple([]),
    current_raid: z.tuple([])
});

const shippingCeruleanSkyportSchema = z.object({
    is_shipping: z.literal(true),
    is_intercepting: z.literal(false),
    current_shipment: currentShipmentSchema,
    current_raid: z.tuple([])
});

const interceptingCeruleanSkyportSchema = z.object({
    is_shipping: z.literal(false),
    is_intercepting: z.literal(true),
    current_shipment: z.tuple([]),
    current_raid: currentRaidSchema
});

export const questCeruleanSkyportSchema = z.union([
    baseCeruleanSkyportQuestSchema,
    shippingCeruleanSkyportSchema,
    interceptingCeruleanSkyportSchema,
]);

export type QuestCeruleanSkyport = z.infer<typeof questCeruleanSkyportSchema>;
