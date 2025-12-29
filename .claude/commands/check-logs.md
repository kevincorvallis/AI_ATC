Check the latest CloudWatch logs for the ai-atc-function Lambda.

Steps:
1. Get the most recent log stream:
   ```
   aws logs describe-log-streams --log-group-name /aws/lambda/ai-atc-function --region us-east-1 --order-by LastEventTime --descending --limit 1
   ```

2. Fetch recent log events from that stream using aws logs get-log-events

3. Summarize any errors or important events found
