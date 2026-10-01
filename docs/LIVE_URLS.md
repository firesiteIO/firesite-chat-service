# Firesite — Live URLs
**Last updated**: March 25, 2026

## Active deployments

| Service | URL | Status | Notes |
|---------|-----|--------|-------|
| Mission Control Canvas | https://firesite-ai-admin.web.app/canvas.html | LIVE | Deployed March 25, 2026 |
| MCP Max | https://max.firesite.ai | LIVE | Production |
| SSE Streaming | https://stream.firesite.ai | LIVE | Cloud Run direct |
| iamthoms.com | https://iamthoms.com | LIVE | Customer Zero |
| admin.firesite.ai | Pending custom domain setup | Planned | Point to firesite-ai-admin.web.app |

## Pending custom domain
`admin.firesite.ai` needs to be pointed at `firesite-ai-admin.web.app` in Cloudflare:
- Type: CNAME
- Name: admin
- Target: firesite-ai-admin.web.app
- Proxy: ON

Until then, the canvas is live at:
**https://firesite-ai-admin.web.app/canvas.html**

## How Claude Desktop updates the canvas
Claude Desktop has write access to:
`/Users/thomasbutler/development/Firesite/firesite-chat-service/docs/`

Canvas data lives in `CLAUDE_CODE_INSTRUCTIONS_CANVAS.md` (the GRAPH_DATA JSON).

Update workflow:
1. Claude Desktop edits the JSON in `CLAUDE_CODE_INSTRUCTIONS_CANVAS.md`
2. Claude Code CLI runs: `firebase deploy --only hosting:firesite-admin`
3. Canvas is live-updated within ~30 seconds

**This is the living dashboard. It evolves every session.**
