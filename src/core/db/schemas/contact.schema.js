export const contactSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        first_name: {
            type: 'string'
        },
        last_name: {
            type: 'string'
        },
        email: {
            type: 'string',
            maxLength: 200
        },
        phone: {
            type: 'string'
        },
        company: {
            type: 'string'
        },
        business_name: {
            type: 'string'
        },
        value: {
            type: 'number'
        },
        stage_id: {
            type: 'string',
            maxLength: 100
        },
        source: {
            type: 'string'
        },
        status: {
            type: 'string'
        },
        assigned_to: {
            type: 'string'
        },
        created_at: {
            type: 'string',
            format: 'date-time'
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
            maxLength: 50
        }
    },
    required: ['id', 'email', 'stage_id', 'updated_at'],
    indexes: ['stage_id', 'email', 'updated_at']
};
