# AluCalc OS Bulk Calculation API Documentation

Welcome to the AluCalc OS Commercial API. This endpoint allows professional engineering teams to perform large-scale calculations using our proprietary structural analysis engine and AI Copilot.

## Base URL
`POST /api/bulk-calc`

## Authentication
(Preview Mode) Authentication is currently via `X-API-KEY` header. Contact support for your production B2B token.

## Request Modes

### 1. AI-Powered Natural Language Batch
Pass multiple engineering queries in plain language. Our Copilot will resolve missing parameters using "Smart Assumptions".

**Payload:**
```json
{
  "queries": [
    "aluminum 6061 beam length 2m with 5kn force",
    "beton kiriş 3m uzunluk",
    "carbon fiber rod deflection scenario A"
  ]
}
```

### 2. Standard Row-Based Calculation
Professional grid-based input for exact parameters.

**Payload:**
```json
{
  "calculator": "beam-analysis-v4",
  "rows": [
    { "material": "steel", "grade": "S355", "length": 5000, "force": 10000 },
    { "material": "aluminum", "grade": "6063-T6", "length": 2500, "force": 2000 }
  ]
}
```

## Response Format
Returns a JSON object containing results for each entry, including a summary of assumptions made by the AI.

## Rate Limits
Standard Tier: 100 requests / minute.
Enterprise: Unlimited.
