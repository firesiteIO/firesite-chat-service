# Edge Case Testing for Firesite Chat Service

## Test Status
- Created: 2025-01-06
- Purpose: Systematic edge case testing as outlined in SESSION.md
- WARNING: Do NOT modify core streaming architecture - testing only!

## Test Cases to Verify

### 1. Nested Lists
```markdown
1. First level ordered
   - Nested unordered item
   - Another nested item
     1. Deeply nested ordered
     2. Another deep ordered
   - Back to level 2
2. Second top level
   * Mixed list markers
   + Different markers
```

### 2. Tables in Blockquotes
```markdown
> This is a blockquote containing a table:
> 
> | Name | Age | City |
> |------|-----|------|
> | John | 25  | NYC  |
> | Jane | 30  | LA   |
> 
> The table should render properly inside the blockquote.
```

### 3. Code Blocks with Different Languages
```javascript
// JavaScript with syntax highlighting
function testFunction() {
  return "Hello World";
}
```

```python
# Python code block
def test_function():
    return "Hello World"
```

```bash
# Bash commands
echo "Testing bash syntax"
ls -la
```

### 4. Mixed Content Rapid Transitions
Paragraph text immediately followed by:

```json
{
  "test": "JSON without empty line",
  "immediate": true
}
```

Back to paragraph text with **bold** and *italic* formatting.

### 5. Complex Nested Structures
> #### Header in Blockquote
> 
> This blockquote contains:
> 
> 1. An ordered list
> 2. With multiple items
>    - Including nested unordered
>    - With sub-items
> 
> ```javascript
> // Code block in blockquote
> const test = "complex nesting";
> ```
> 
> And back to blockquote text.

### 6. Rapid List Type Changes
- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2

+ Plus marker list
+ Another plus item

* Asterisk marker list
* Another asterisk item

### 7. Empty Lines and Spacing
Paragraph with empty lines.



Multiple empty lines above.

Normal paragraph after gaps.

### 8. Headers with Various Levels
# H1 Header
## H2 Header  
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

### 9. Inline Code and Formatting
This paragraph has `inline code` and **bold text** and *italic text* and ~~strikethrough~~ and [links](https://example.com).

### 10. Tables with Complex Content
| Feature | Status | Notes |
|---------|--------|-------|
| **Bold** | | Working |
| `Code` | | Syntax highlighting |
| *Italic* | | Formatting preserved |
| [Links](url) | | Clickable |

## Performance Edge Cases

### 11. Large Code Block
```javascript
// Large code block to test performance
const largeFunctionWithLotsOfCode = () => {
  const data = {
    property1: "value1",
    property2: "value2", 
    property3: "value3",
    property4: "value4",
    property5: "value5",
    property6: "value6",
    property7: "value7",
    property8: "value8",
    property9: "value9",
    property10: "value10"
  };
  
  // Processing logic
  Object.keys(data).forEach(key => {
    console.log(`Processing ${key}: ${data[key]}`);
  });
  
  return data;
};
```

### 12. Rapid Content Type Switching
Normal text.

```
Code block.
```

Normal text again.

> Blockquote.

Normal text.

| Table | Content |
|-------|---------|
| Cell  | Data    |

Normal text.

## Expected Behavior
1. All content should render without duplication
2. Streaming should be smooth for text content
3. Code blocks should appear instantly with syntax highlighting
4. Tables should render instantly and properly formatted
5. No DOM violations or re-renders
6. Natural typing effect should work for text elements
7. Sequential streaming queue should prevent animation overlap