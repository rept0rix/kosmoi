export const vendorSchema = {
    title: 'vendor schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        business_name: {
            type: 'string'
        },
        category: {
            type: 'string'
        },
        status: {
            type: 'string'
        },
        created_at: {
            type: 'string',
            format: 'date-time'
        },
        updated_at: {
            type: 'string',
            format: 'date-time'
        },
        vibes: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        images: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        price_level: {
            type: 'string'
        },
        instagram_handle: {
            type: 'string'
        },
        open_status: {
            type: 'string'
        },
        address: {
            type: 'string'
        },
        website: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        phone: {
            type: 'string'
        },
        opening_hours: {
            type: 'string'
        },
        languages: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    },
    required: ['id', 'business_name', 'status']
};
