# MCP Max Integration Testing Plan
**Date:** July 6th, 2025  
**Status:** Testing Dynamic Model Selection & Context Integration

## Test Phase 1: Model Selection ✅

### ✅ Implementation Complete:
1. **Fixed Hardcoded Model**: Removed `claude-3-5-sonnet-20241022` hardcoding, now defaults to `claude-3-7-sonnet-20250219`
2. **Added Dynamic Selection**: Model now comes from localStorage → context → fallback
3. **Added UI Controls**: Model selector dropdown in main interface
4. **Added Event Handling**: Model changes update context and localStorage

### 🧪 Testing Steps:

#### A) Test Model UI Controls
1. Open http://localhost:5173
2. Look for "Model:" dropdown in controls
3. Change model selection
4. Verify console shows: `🤖 Model changed to: [Model Name] ([model-id])`
5. Verify localStorage updated: `localStorage.getItem('selectedModel')`

#### B) Test Context Integration  
1. Open Settings Panel (gear icon)
2. Navigate to "Context Settings" tab
3. Test sample contexts from `/docs/sample-contexts.json`

## Test Phase 2: Context Object Testing

### A) MMCO Testing (Micro Meta Context Objects)
**Sample Data:** Use `sample_mmco_kanban` from sample-contexts.json

**Test Steps:**
1. Open Settings Panel → Context Settings
2. Paste MMCO JSON into "MMCO" textarea
3. Click "Validate JSON" - should show "Valid JSON!"
4. Click "Apply Changes"
5. Send test message: "What project are we working on?"
6. Verify Claude responds with Kanban project awareness

**Expected Result:** Claude should reference "Firesite Kanban System" and show understanding of current development phase.

### B) UACP Testing (Universal AI Context Profile)
**Sample Data:** Use `sample_uacp_firesite` from sample-contexts.json

**Test Steps:**
1. Paste UACP text into "UACP" textarea
2. Apply changes
3. Send message: "Tell me about our company"
4. Verify Claude demonstrates Firesite company knowledge

**Expected Result:** Claude should reference Firesite's mission, revolutionary achievements, and technology stack.

### C) PACP Testing (Personal AI Context Profile)
**Sample Data:** Use `sample_pacp_developer` from sample-contexts.json

**Test Steps:**
1. Paste PACP JSON into "PACP" textarea
2. Validate and apply
3. Send message: "Explain how our streaming service works"
4. Compare response style to baseline

**Expected Result:** Response should be "direct and technical" with "comprehensive detail level" and "commented with architecture notes."

## Test Phase 3: AI Mode Behavior Validation

### Test Different AI Modes:
1. **Developer Mode**: Technical, code-focused responses
2. **Analyst Mode**: Data-driven, analytical responses  
3. **Planner Mode**: Strategic, project-focused responses
4. **Documenter Mode**: Clear, documentation-style responses

### Testing Protocol:
**Same question to different modes:** "How should we approach the Kanban implementation?"

**Expected Variations:**
- **Developer**: Technical implementation details, code examples
- **Analyst**: Requirements analysis, risk assessment
- **Planner**: Timeline, milestones, resource allocation
- **Documenter**: Step-by-step process documentation

## Test Phase 4: Server Switching with Context

### Test Context Persistence:
1. Set up MMCO/UACP/PACP contexts
2. Switch from Base Server to Max Server
3. Verify contexts preserved across switch
4. Test conversation continuity

### Test Model Selection Across Servers:
1. Select Claude 4 Sonnet
2. Switch MCP servers
3. Verify model selection preserved
4. Test different models with different servers

## Test Phase 5: Real-World Scenarios

### Scenario 1: Kanban Planning Session
**Setup:**
- MMCO: `sample_mmco_kanban`
- UACP: `sample_uacp_firesite`  
- PACP: `sample_pacp_developer`
- AI Mode: Planner
- Model: Claude 4 Sonnet

**Test Question:** "Help me create a development plan for the Kanban system with AI integration."

**Expected:** Comprehensive plan referencing Firesite context, Kanban requirements, and developer preferences.

### Scenario 2: Technical Architecture Review
**Setup:**
- AI Mode: Developer
- Model: Claude 3.7 Sonnet
- Same contexts

**Test Question:** "Review our streaming architecture and suggest improvements."

**Expected:** Technical analysis of zero re-render architecture with specific code recommendations.

### Scenario 3: Business Impact Analysis  
**Setup:**
- PACP: `sample_pacp_manager`
- AI Mode: Analyst
- Model: Claude 4 Sonnet

**Test Question:** "What's the business impact of our context-aware AI breakthrough?"

**Expected:** Business-focused analysis with ROI considerations and strategic implications.

## Success Criteria

### ✅ Dynamic Model Selection
- [x] Model dropdown functional
- [x] Selection persisted in localStorage
- [x] Context state updated
- [x] Console logging confirms changes

### 🔄 Context Integration (Testing Required)
- [ ] MMCO objects processed correctly
- [ ] UACP content influences responses
- [ ] PACP preferences change response style
- [ ] JSON validation works properly

### 🔄 AI Mode Behavior (Testing Required)  
- [ ] Different modes produce different response styles
- [ ] Mode changes reflected in conversation
- [ ] Context + mode combinations work correctly

### 🔄 Server Integration (Testing Required)
- [ ] Contexts preserved across server switches
- [ ] Model selection works with both servers
- [ ] Session continuity maintained

## Next Steps After Testing

1. **Document Results**: Record actual vs expected behavior
2. **Fix Issues**: Address any integration problems found
3. **Enhance Integration**: Add missing features discovered during testing
4. **Prepare for Kanban**: Use validated system for Kanban development

---

**Testing Status:** Ready for Manual Testing  
**Last Updated:** July 6th, 2025, 12:00 PM