#!/usr/bin/env bash
# Creates/updates a separate authenticated deployment. Does not alter the legacy API.
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ "${1:-}" == "--help" ]]; then
    cat <<'HELP'
Deploy the optional, protected AI ATC backend with AWS CloudFormation.
Required environment variables (do not put OpenAI credentials on the command line):
  EXPECTED_AWS_ACCOUNT_ID   12-digit account ID; must match the active AWS identity
  ARTIFACT_BUCKET           Existing private S3 bucket in AWS_REGION in that account
  OPENAI_SECRET_ARN         Secrets Manager secret containing {"OPENAI_API_KEY":"..."}
  JWT_ISSUER               HTTPS identity-provider issuer URL
  JWT_AUDIENCE             Audience configured for the sign-in application
Optional:
  AWS_REGION=us-east-1      AWS_PROFILE uses standard AWS CLI behavior
  STACK_NAME=ai-atc-protected
  ALLOWED_ORIGINS=https://klee.page  Comma-separated HTTPS origins (no wildcard)
  REQUIRED_SCOPE=atc:practice

This deploys paid AWS resources. It neither secures nor removes the old anonymous
API. Read backend/README.md before enabling live AI in any client.
HELP
    exit 0
fi
if [[ $# -ne 0 ]]; then echo 'Unknown argument. Use --help.' >&2; exit 2; fi
for command in aws python3; do
    command -v "$command" >/dev/null || { echo "Missing required tool: $command" >&2; exit 1; }
done
for name in EXPECTED_AWS_ACCOUNT_ID ARTIFACT_BUCKET OPENAI_SECRET_ARN JWT_ISSUER JWT_AUDIENCE; do
    if [[ -z "${!name:-}" ]]; then echo "Required environment variable is missing: $name" >&2; exit 1; fi
done
export AWS_REGION="${AWS_REGION:-us-east-1}"
export STACK_NAME="${STACK_NAME:-ai-atc-protected}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://klee.page}"
export REQUIRED_SCOPE="${REQUIRED_SCOPE:-atc:practice}"
export AWS_PAGER=""

# Validate before cloud writes. Do not source .env as executable shell code.
python3 - <<'PY'
import os, re, sys
from urllib.parse import urlsplit

def valid_https_origin(value):
    parsed = urlsplit(value)
    return parsed.scheme == 'https' and parsed.hostname and not parsed.username and not parsed.password and parsed.path in ('', '/') and not parsed.query and not parsed.fragment and '*' not in value

checks = [
    (re.fullmatch(r'\d{12}', os.environ['EXPECTED_AWS_ACCOUNT_ID']), 'EXPECTED_AWS_ACCOUNT_ID must be a 12-digit account ID'),
    (re.fullmatch(r'[a-zA-Z][a-zA-Z0-9-]{0,39}', os.environ['STACK_NAME']), 'STACK_NAME must be 1-40 letters, numbers or hyphens'),
    (re.fullmatch(r'[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]', os.environ['ARTIFACT_BUCKET']), 'ARTIFACT_BUCKET must be an S3 bucket name'),
    (all(valid_https_origin(value) and not value.endswith('/') for value in os.environ['ALLOWED_ORIGINS'].split(',')), 'ALLOWED_ORIGINS must contain exact HTTPS origins, without trailing slashes'),
    (os.environ['JWT_ISSUER'].startswith('https://') and not any(char.isspace() for char in os.environ['JWT_ISSUER']), 'JWT_ISSUER must be an HTTPS URL'),
    (bool(re.fullmatch(r'[^\s,]{1,256}', os.environ['JWT_AUDIENCE'])), 'JWT_AUDIENCE must be a single non-empty audience'),
    (bool(re.fullmatch(r'[^\s,]{1,128}', os.environ['REQUIRED_SCOPE'])), 'REQUIRED_SCOPE must be a single OAuth scope'),
]
expected_secret_prefix = f"arn:aws:secretsmanager:{os.environ['AWS_REGION']}:{os.environ['EXPECTED_AWS_ACCOUNT_ID']}:secret:"
checks.append((os.environ['OPENAI_SECRET_ARN'].startswith(expected_secret_prefix), 'OPENAI_SECRET_ARN must be in the expected account and region'))
for valid, message in checks:
    if not valid:
        sys.exit(message)
PY

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION")"
if [[ "$ACCOUNT_ID" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
    echo 'Refusing deployment: active AWS account does not match EXPECTED_AWS_ACCOUNT_ID.' >&2
    exit 1
fi
aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" --expected-bucket-owner "$EXPECTED_AWS_ACCOUNT_ID" --region "$AWS_REGION"
PUBLIC_ACCESS_BLOCK="$(aws s3api get-public-access-block --bucket "$ARTIFACT_BUCKET" --expected-bucket-owner "$EXPECTED_AWS_ACCOUNT_ID" --region "$AWS_REGION" --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' --output text)"
if [[ "$PUBLIC_ACCESS_BLOCK" != $'True\tTrue\tTrue\tTrue' ]]; then
    echo 'Artifact bucket must have all four S3 Block Public Access settings enabled.' >&2
    exit 1
fi
BUCKET_REGION="$(aws s3api get-bucket-location --bucket "$ARTIFACT_BUCKET" --expected-bucket-owner "$EXPECTED_AWS_ACCOUNT_ID" --query LocationConstraint --output text --region "$AWS_REGION")"
if [[ "$BUCKET_REGION" == 'None' || "$BUCKET_REGION" == 'null' ]]; then BUCKET_REGION='us-east-1'; fi
if [[ "$BUCKET_REGION" != "$AWS_REGION" ]]; then echo 'Artifact bucket must be in AWS_REGION.' >&2; exit 1; fi
aws secretsmanager describe-secret --secret-id "$OPENAI_SECRET_ARN" --region "$AWS_REGION" --query ARN --output text >/dev/null

# Use a fresh private directory; no host-native dependencies are bundled.
DEPLOY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ai-atc-deploy.XXXXXXXX")"
trap 'rm -rf -- "$DEPLOY_DIR"' EXIT
export DEPLOY_DIR
python3 - <<'PY'
import hashlib, json, os, pathlib, zipfile
root = pathlib.Path(os.environ['DEPLOY_DIR'])
source = pathlib.Path('lambda_function.py').read_bytes()
compile(source, 'lambda_function.py', 'exec')
with zipfile.ZipFile(root / 'lambda.zip', 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    info = zipfile.ZipInfo('lambda_function.py', date_time=(2026, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    archive.writestr(info, source)
key = 'ai-atc/' + hashlib.sha256((root / 'lambda.zip').read_bytes()).hexdigest() + '.zip'
(root / 'artifact-key').write_text(key)
values = {'ArtifactBucket': os.environ['ARTIFACT_BUCKET'], 'ArtifactKey': key,
          'OpenAISecretArn': os.environ['OPENAI_SECRET_ARN'], 'JwtIssuer': os.environ['JWT_ISSUER'],
          'JwtAudience': os.environ['JWT_AUDIENCE'], 'AllowedOrigins': os.environ['ALLOWED_ORIGINS'],
          'RequiredScope': os.environ['REQUIRED_SCOPE']}
(root / 'parameters.json').write_text(json.dumps([{'ParameterKey': key, 'ParameterValue': value} for key, value in values.items()]))
PY
python3 -m unittest discover -s ../tests -p 'backend*.py'
aws cloudformation validate-template --template-body file://template.json --region "$AWS_REGION" >/dev/null
ARTIFACT_KEY="$(cat "$DEPLOY_DIR/artifact-key")"
aws s3api put-object --bucket "$ARTIFACT_BUCKET" --key "$ARTIFACT_KEY" \
    --body "$DEPLOY_DIR/lambda.zip" --server-side-encryption AES256 \
    --expected-bucket-owner "$EXPECTED_AWS_ACCOUNT_ID" --region "$AWS_REGION" >/dev/null
aws cloudformation deploy --template-file template.json --stack-name "$STACK_NAME" \
    --parameter-overrides "file://$DEPLOY_DIR/parameters.json" --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset --region "$AWS_REGION"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs' --output table
printf '%s\n' 'Protected API deployed. Verify signed-in access before configuring a client.'
