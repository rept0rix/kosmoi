export const taskSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    indexes: ['created_at', 'meeting_id'],
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        title: {
            type: 'string'
        },
        status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'done', 'failed']
        },
        description: {
            type: 'string'
        },
        assigned_to: {
            type: 'string'
        },
        meeting_id: {
            type: 'string',
            maxLength: 100
        },
        priority: {
            type: 'string'
        },
        result: {
            type: 'string'
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            maxLength: 100
        },
        updated_at: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'title', 'status']
};

export const leadSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        phone: {
            type: 'string'
        },
        status: {
            type: 'string'
        },
        pipeline_id: {
            type: 'string'
        },
        stage_id: {
            type: 'string'
        },
        total_value: {
            type: 'number'
        },
        created_at: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'name']
};
