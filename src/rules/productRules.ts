export const PRODUCT_RULES = {
  personal: {
    typicalTenures: [24, 36, 48, 60],
    baseRate: {
      min: 11,
      max: 16,
    },
    secured: false,
  },

  business: {
    typicalTenures: [24, 36, 48, 60],
    baseRate: {
      min: 11,
      max: 17,
    },
    secured: false,
  },

  lap: {
    typicalTenures: [60, 84, 120, 180],
    baseRate: {
      min: 9,
      max: 13,
    },
    secured: true,
  },

  gold: {
    typicalTenures: [12, 24, 36],
    baseRate: {
      min: 9,
      max: 15,
    },
    secured: true,
  },

  two_wheeler: {
    typicalTenures: [24, 36, 48, 60],
    baseRate: {
      min: 10,
      max: 15,
    },
    secured: true,
  },

  home: {
    typicalTenures: [120, 180, 240],
    baseRate: {
      min: 8,
      max: 11,
    },
    secured: true,
  },
} as const;