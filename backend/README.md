# Optional authenticated AI backend

The published web demo is self-contained. This backend is an optional live AI service; it is **not required or called by the public demo**. The local handler and deployment path have been hardened, but the authenticated service has not been deployed or tested with a real sign-in provider. Existing iOS clients do not yet supply JWT access tokens.

Do not point public clients at the historical anonymous endpoint. The old `ai-atc-function` and API Gateway are separate resources: this deployment script neither secures nor removes them. Roll out authenticated clients and retire that endpoint explicitly before claiming the paid AI service is production ready.

## Runtime and request contract

The Lambda uses Python 3.11 standard-library HTTPS and has no third-party packages. The model remains `gpt-4`; no migration is included. Removing the SDK also removes host-dependent wheel packaging. Scenario generation requests plain JSON and validates the result; it does not send a JSON-mode option to this legacy model.

`POST /atc` requires `Content-Type: application/json` and an API Gateway verified JWT access token. The configured issuer and audience must match, `sub` must exist, and the token must have the configured practice scope (default `atc:practice`). CORS is an additional browser-origin restriction, not authentication. Only API Gateway integration metadata is trusted for authorization; a caller-supplied bearer header cannot authorize direct Lambda invocation. Keep IAM `lambda:InvokeFunction` permission restricted to operators and the provisioned Gateway integration.

Supported bodies:

```json
{"scenario":"pattern_work","message":"Metro Tower, Skyhawk 12345, ready for departure.","history":[]}
{"action":"generate_scenario","prompt":"Practice a fictional departure at KSBN"}
{"action":"get_charts","airport":"KSBN"}
```

Scenarios: `pattern_work`, `ground_operations`, `flight_following`, `emergency`. A request body is limited to 32 KiB, messages to 500 characters, scenario-generation prompts to 1,000 characters, and optional `customSystemPrompt` context to 2,000 characters. History accepts at most 20 user/assistant messages, each at most 2,000 characters and at most 16,000 characters total. System/tool roles are rejected. Custom context never replaces server instructions.

Upstream socket operations time out after 10 seconds; the Lambda and Gateway have 15-second limits. There are no automatic billable retries. Completion sizes and chart payloads are bounded. Empty/truncated completions, invalid scenario structures, unsafe chart URLs and upstream errors are rejected. Public error responses and application logs exclude upstream exception messages, credentials and user prompts. Return codes distinguish validation (400/413/415), missing/insufficient access (401/403), throttling (429), provider failures (502/504) and absent configuration (503).

All scenarios are fictional communication exercises. AI responses, weather, frequencies and charts are not validated operational flight information.

## Verification

From the repository root:

```sh
python3 -m unittest discover -s tests -p 'backend*.py' -v
python3 -m py_compile backend/lambda_function.py
bash -n backend/deploy.sh
aws cloudformation validate-template --template-body file://backend/template.json --region us-east-1
```

Tests cover authorization fail-closed behavior, origin handling, preflight, JSON and byte limits, role injection, custom-context isolation, upstream errors/timeouts/size limits, output validation, chart URL allowlisting, and deployment configuration. Tests mock network calls; they do not demonstrate model quality, provider account access, sign-in, or deployed infrastructure behavior.

## Deployment prerequisites

1. Configure an identity provider and client sign-in flow that issue access tokens with an audience, subject, and `atc:practice` scope. Prevent unapproved users from obtaining that scope. The web demo and current native app do not implement this flow.
2. Create a private S3 artifact bucket in the target account and region with all four Block Public Access settings enabled. Use lifecycle/versioning rules appropriate for deployment artifacts.
3. Create a Secrets Manager JSON secret containing `OPENAI_API_KEY`, in that account and region. The deployment identity needs access to that secret and the CloudFormation/IAM/Lambda/API Gateway/log/metric resources. Do not put the key in frontend files, shell command arguments or deployment output.
4. Set `EXPECTED_AWS_ACCOUNT_ID`, `ARTIFACT_BUCKET`, `OPENAI_SECRET_ARN`, `JWT_ISSUER`, and `JWT_AUDIENCE` in the environment. Optionally set `AWS_PROFILE`, `AWS_REGION` (default `us-east-1`), `STACK_NAME` (default `ai-atc-protected`), exact comma-separated `ALLOWED_ORIGINS` (default `https://klee.page`), and `REQUIRED_SCOPE`.
5. Run `backend/deploy.sh`. This creates or updates a separate, paid AWS stack. It validates identity and configuration before writing; it does not execute a `.env` file. The function ZIP includes only the handler and uses a content-addressed artifact key. The script runs tests and validates the template before uploading.

The stack creates a JWT-protected route, explicit origin list, global Gateway throttling at 1 request/second with a burst of 2, Lambda reserved concurrency of 2, scoped API invocation permission, access/application logs retained for 30 days, and a Lambda error alarm. Configure the alarm's notification action and add API 5xx/latency/throttle alerts; caught upstream errors are HTTP responses and do not increment Lambda's Errors metric. Global throttling and concurrency do not implement per-user allowances or an absolute spending cap. Configure provider project limits, AWS budget alerts and per-user quotas before a wider live AI launch.

CloudFormation resolves the Secrets Manager reference into Lambda's encrypted environment during a resource update. A secret value change alone does not refresh the Lambda environment. After rotating the key, update the function resource and verify the new key works before revoking the old one. Limit IAM access to Lambda configuration as well as Secrets Manager.

After deployment, verify anonymous/expired/wrong-audience/wrong-scope requests are rejected, preflight accepts only configured origins, a legitimate signed-in request succeeds, failure responses are safe, and throttling is enforced. Run model-output evaluation with representative aviation practice cases. Retire or protect the old anonymous API as part of the client rollout. Do not describe this optional service as production-certified until those checks and the sign-in integration are complete.

## References

- [API Gateway JWT authorizers and scopes](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [AWS CLI CloudFormation deployment parameters](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/deploy.html)
- [Secrets Manager dynamic references and rotation behavior](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references-secretsmanager.html)
- [OpenAI Chat Completions API](https://developers.openai.com/api/reference/resources/chat)
