Test the ATC API endpoint with a sample request.

Run this curl command and report the response:

```bash
curl -X POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"pattern_work","message":"Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern"}'
```

Verify:
- Response includes `"success": true`
- ATC response is realistic and appropriate
- Response time is reasonable (< 10 seconds)
