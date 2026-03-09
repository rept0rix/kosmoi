# Lead Listing Tool API Specification

## 1. Endpoint

`/api/v1/leads`

## 2. Request Parameters

| Parameter | Type   | Description                                                                | Required | Example             |
| :---------- | :----- | :------------------------------------------------------------------------- | :------- | :------------------ |
| `page`      | `int`  | Page number for pagination.                                                | No       | `1`                 |
| `limit`     | `int`  | Number of leads per page.                                                  | No       | `20`                |
| `sort_by`   | `string` | Field to sort by.                                                        | No       | `last_interaction`  |
| `sort_order`| `string` | Sort order (asc or desc). Defaults to `desc`.                             | No       | `asc`               |

## 3. Filtering Options

The following parameters can be used to filter the leads:

*   `last_interaction_date_from`: Filter leads with last interaction date greater than or equal to this date (ISO 8601 format). Example: `2024-01-01T00:00:00Z`
*   `last_interaction_date_to`: Filter leads with last interaction date less than or equal to this date (ISO 8601 format). Example: `2024-01-31T23:59:59Z`
*   `status`: Filter leads by status (e.g., `new`, `in_progress`, `converted`, `closed`). Can be a single value or a comma-separated list. Example: `new,in_progress`
*   `assigned_user_id`: Filter leads by assigned user ID. Can be a single value or a comma-separated list.  Example: `123,456`
*   `query`: free text search on lead name and company


## 4. Returned Data Format (JSON)

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "string",
      "assigned_user_id": "string",
      "last_interaction": "string" (ISO 8601 format), 
      "created_at": "string" (ISO 8601 format), 
      "updated_at": "string" (ISO 8601 format)
    },
    ...
  ],
  "pagination": {
    "total": "int",
    "page": "int",
    "limit": "int",
    "next": "string" (URL to the next page, or null if no next page),
    "previous": "string" (URL to the previous page, or null if no previous page)
  }
}
```