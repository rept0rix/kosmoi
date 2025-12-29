export const taskSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100 // primary key needs a max length
        },
        title: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        status: {
            type: 'string',
            maxLength: 50,
            default: 'pending' // pending, in_progress, done
        },
        priority: {
            type: 'string',
            default: 'medium' // low, medium, high
        },
        assigned_to: {
            type: 'string',
            maxLength: 100
        },
        due_date: {
            type: 'string',
            format: 'date-time'
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            maxLength: 50
        },
        meeting_id: {
            type: 'string',
            maxLength: 100
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
            maxLength: 50
        }
    },
    required: [
        'id',
        'title',
        'status',
        'assigned_to',
        'updated_at',
        'created_at',
        'meeting_id',
        'description',
        'priority'
    ],
    indexes: [
        'status',
        'assigned_to',
        'updated_at',
        'created_at',
        'meeting_id'
    ]
};
