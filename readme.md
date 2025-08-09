run the webhook
-
`cd webhook-callback`
`npm run dev`

run deep research
-
```powershell
cd stock-research-prompt
```
then
```powershell
node index.js AAPL
```
or
```powershell
node index.js AAPL --dry-run
```

post an article
-
- put article content in a file
- modify post-draft.js to point to the file
- run the script
```powershell
node post-draft.js
```

add papers to the database
-
- find papers
- put them in /docs
- add them to data/papers.json

cancel a response
-
get a response_id and run it like this:
```powershell
curl -X POST http://localhost:3002/response/response_id_here/cancel
```

manually trigger log file parsing
-
get a log file and run like this:
```powershell
curl -X POST http://localhost:3002/parse-log/2025-08-07T03-17-37-099Z-manual-response.json
```