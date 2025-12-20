export const stageSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        pipeline_id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'string'
        },
        color: {
            type: 'string'
        },
        position: {
            type: 'number',
            multipleOf: 1,
            minimum: 0,
            maximum: 1000000
        },
        is_default: {
            type: 'boolean'
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
    required: ['id', 'name', 'pipeline_id', 'position', 'updated_at'],
    indexes: ['pipeline_id', 'position', 'updated_at']
};
