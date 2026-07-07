# Technical Template: API Interface Specification
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes a strict template for detailing REST, SSE, and streaming API endpoints, ensuring unified error shapes, auth standards, and structural examples.
- **Audience**: Fullstack developers, mobile companion app developers, QA automation engineers, and API consumers.
- **Prerequisites**: Clear definition of route controllers and data contracts.
- **Dependencies**: None.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 800 - 1500 words per route cluster.
- **Maintenance Frequency**: Updated on any changes to endpoint schemas or route policies.
- **Owner**: Senior Backend Engineer / API Designer.
- **Review Checklist**: Verify exact HTTP status mappings, check token scope parameters, validate payload format consistency, ensure pagination standard is defined.
- **Completion Criteria**: Complete and error-free API specifications ready for implementation or mock-service stubbing.
- **Versioning Strategy**: Incremented in line with SemVer API rules (v1, v2) with deprecation notes where applicable.

---

## 2. API General Specifications and Constraints

All endpoints within the AgriSense AI workspace must strictly conform to these structural guidelines:

### 2.1 Global Protocol Rules
*   **Base URL**: `/api/v1` for production containers.
*   **Response Format**: `application/json` exclusively.
*   **Character Encoding**: `UTF-8`.
*   **Transport Layer**: TLS 1.3 forced on all endpoints.

### 2.2 Rate Limiting
*   **Authenticated Farmers**: 60 requests per minute.
*   **Admins**: 120 requests per minute.
*   **Public Endpoints**: 10 requests per minute per IP address.
*   *Exceeded limits return a standard HTTP 429 Too Many Requests response.*

---

## 3. REST Endpoint Specifications (Copy and Complete)

```markdown
### 3.1 Endpoint: [HTTP-METHOD] [PATH]
*Provide a concise, plain-language description of what this route executes.*

#### Route Information
- **Auth Required**: <Yes | No>
- **Roles Allowed**: <farmer | admin | public>
- **Required Token Scopes**: <e.g., plots:write, crops:read>
- **Content-Type**: <application/json | multipart/form-data>

#### Query Parameters
| Parameter | Type | Required | Default | Description / Constraint |
| :--- | :--- | :---: | :--- | :--- |
| `page` | Integer | No | `1` | Pagination offset index. |
| `limit` | Integer | No | `20` | Maximum records to return. Max limit: `100`. |
| `sort` | String | No | `created_at` | Sort order variable. |

#### Request Body Schema
*Specify the JSON data payload structure.*

```json
{
  "property_name": "value_type"
}
```

#### Response Payload (200 OK)
*Provide a complete, real-world example of a successful response.*

```json
{
  "status": "success",
  "data": {}
}
```

#### Error Responses Reference
*Document the exact failure payloads returned by this endpoint.*

*   **401 Unauthorized**: Token is missing, expired, or invalid.
*   **403 Forbidden**: User's role lacks permissions for this action.
*   **422 Unprocessable Entity**: Body validation failed.

```json
{
  "detail": "Detailed validation or system failure message."
}
```
```

---

## 4. Server-Sent Events (SSE) and Streaming Specifications

For long-running real-time streams (e.g., streaming weather alerts or live CIE analysis), use the following specification format:

### 4.1 Endpoint: GET `/api/v1/stream/weather`
*Streams continuous climate warnings and telemetry updates based on GPS coordinates.*

- **Transport Protocol**: HTTP/1.1 or HTTP/2 persistent connection.
- **Headers Required**:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

#### Event Stream Frame Schema
Every event sent down the stream must use the standard structural frame:

```text
event: <EVENT_TYPE_SLUG>
id: <UNIQUE_EVENT_ID>
data: { "timestamp": "YYYY-MM-DDTHH:mm:ssZ", "payload": {} }
```

---

## 5. API Versioning, Deprecation, and Life Cycle

AgriSense AI API deprecations follow a strict, multi-month sunset process:
1.  **Notification Phase**: When an endpoint is marked for deprecation, the response header `X-API-Deprecation-Date: YYYY-MM-DD` is appended.
2.  **Sunset Window**: The deprecated endpoint remains active for a minimum of 90 calendar days to allow clients to migrate.
3.  **Removal Phase**: After the sunset window, the route is disabled and returns `410 Gone`.
