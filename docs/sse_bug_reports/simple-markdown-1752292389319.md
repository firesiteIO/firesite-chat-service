AUTO PROMPT TO CLAUDE:

Create a simple markdown example with a heading, paragraph, and bullet list about cats.

COMMENTS & OBSERVATIONS: 

This test was run automatically using the live test interface. Test result: PASSED

This test passed successfully with no observed issues.

Test Name: simple-markdown
Expected Elements: heading, paragraph, list

This issue was captured during live testing of the Firesite chat interface. Live test PASSED

SSE DATA STREAM:

event: start
data: {"success":true}

event: chunk
data: {"content":"# All"}

event: chunk
data: {"content":" About Cats"}

event: chunk
data: {"content":"\n\nCats are fascinating creatures that"}

event: chunk
data: {"content":" have been domesticated for thousands of"}

event: chunk
data: {"content":" years. They are known for their independence"}

event: chunk
data: {"content":", playfulness, and unique"}

event: chunk
data: {"content":" personalities. Many people aroun"}

event: chunk
data: {"content":"d the world keep cats as belove"}

event: chunk
data: {"content":"d pets.\n\n## Common"}

event: chunk
data: {"content":" Cat Breeds\n\n* Si"}

event: chunk
data: {"content":"amese\n* Maine"}

event: chunk
data: {"content":" Coon\n*"}

event: chunk
data: {"content":" Persian\n* Bengal\n* Rag"}

event: chunk
data: {"content":"doll\n* Scottish Fold"}

event: end
data: {"success":true}



RENDERED HTML OUTPUT:

<h1>All About Cats</h1><p>Cats are fascinating creatures that have been domesticated for </p><p>Many people around the world keep cats as beloved pets.</p><h2>Common Cat Breeds</h2><ul><li>Siamese</li><li>Maine Coon</li><li>Persian</li><li>Bengal</li><li>Ragdoll</li><li>Scottish Fold</li></ul>

CONSOLE LOGS:

No relevant console logs captured

PARSER STATE TRANSITIONS:

No parser state transitions captured

PERFORMANCE METRICS:

- duration: 3556.8650000095367
- responseLength: 325
- domLength: 294
- testName: simple-markdown

CAPTURE METADATA:

- Session ID: bug-1752292385760-awkgjupmv
- Test Case: simple-markdown
- Generated: 2025-07-12T03:53:09.318Z
- SSE Chunks: 14
- Console Logs: 0
- Parser States: 0

---
*Generated automatically by Firesite Bug Report Capture*