Quick update of Lambda function code without full redeployment.

Steps:
1. Create the deployment package:
   ```bash
   cd /Users/kevin/Downloads/AI_ATC/backend
   rm -rf package lambda_package.zip
   mkdir package
   pip3 install -r requirements.txt -t package/ --quiet
   cp lambda_function.py package/
   cd package && zip -r ../lambda_package.zip . > /dev/null
   cd ..
   ```

2. Upload to AWS:
   ```bash
   aws lambda update-function-code \
     --function-name ai-atc-function \
     --zip-file fileb://lambda_package.zip \
     --region us-east-1
   ```

3. Clean up:
   ```bash
   rm -rf package lambda_package.zip
   ```

4. Report success and test the function
