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
        }
    },
    required: ['id', 'business_name', 'status']
};
