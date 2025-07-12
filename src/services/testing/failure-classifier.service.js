/**
 * FailureClassifier - Categorizes failures by pattern rather than fixing them
 * 
 * Purpose: Identify systematic failure patterns across test runs
 * This classifier helps us understand WHAT is failing and WHY
 */

export class FailureClassifier {
  constructor() {
    this.classifications = [];
    this.patterns = new Map();
  }

  /**
   * Main classification categories
   */
  static CATEGORIES = {
    // Buffer stage issues
    BUFFER_OVERFLOW: 'Content arrives faster than 150ms processing window',
    BUFFER_UNDERFLOW: 'Content arrives too slowly causing incomplete chunks',
    BUFFER_CORRUPTION: 'Buffer content modified unexpectedly',
    
    // Parser stage issues
    PARSE_BOUNDARY_MISS: 'Parser fails to detect element boundaries correctly',
    PARSE_STATE_LOSS: 'Parser loses track of current state during transitions',
    PARSE_INCOMPLETE_ELEMENT: 'Parser ends element prematurely',
    PARSE_WRONG_DECISION: 'Parser classifies content as wrong type',
    
    // Replay stage issues
    REPLAY_SYNC_ERROR: 'Replay timing doesn\'t match parse instructions',
    REPLAY_DOM_CONFLICT: 'DOM operations conflict with each other',
    REPLAY_INSTRUCTION_LOST: 'Instructions lost between parse and replay',
    
    // Cross-stage issues
    STAGE_MISMATCH: 'Output from one stage doesn\'t match input to next',
    TIMING_CASCADE: 'Timing issues in one stage affect downstream stages'
  };

  /**
   * Classify a failure based on diagnostic data
   * @param {Object} diagnosticData - Data from StageInspector
   * @param {Object} expected - Expected output
   * @param {Object} actual - Actual output
   */
  classify(diagnosticData, expected, actual) {
    const classification = {
      timestamp: Date.now(),
      testName: diagnosticData.testName,
      failureType: this.determineFailureType(diagnosticData),
      stage: this.identifyFailureStage(diagnosticData),
      pattern: this.identifyPattern(diagnosticData, expected, actual),
      frequency: 1,
      diagnosticData
    };
    
    this.classifications.push(classification);
    this.updatePatternFrequency(classification.pattern);
    
    return classification;
  }

  /**
   * Determine the type of failure
   * @param {Object} diagnosticData - Analysis from StageInspector
   */
  determineFailureType(diagnosticData) {
    const { stages, potential_issues } = diagnosticData;
    
    // Check buffer stage
    if (stages.buffer.timing_violations > 0) {
      return 'BUFFER_OVERFLOW';
    }
    
    // Check parser stage
    if (stages.parse.empty_instruction_sets > 0) {
      return 'PARSE_INCOMPLETE_ELEMENT';
    }
    
    if (stages.parse.state_changes > 5) {
      return 'PARSE_STATE_LOSS';
    }
    
    // Check for stage mismatches
    const hasUnclosedCodeBlock = potential_issues.some(
      i => i.type === 'UNCLOSED_CODE_BLOCK'
    );
    if (hasUnclosedCodeBlock) {
      return 'PARSE_BOUNDARY_MISS';
    }
    
    const hasStageMismatch = potential_issues.some(
      i => i.type === 'STAGE_MISMATCH'
    );
    if (hasStageMismatch) {
      return 'STAGE_MISMATCH';
    }
    
    // Default to parse boundary miss if no clear issue
    return 'PARSE_BOUNDARY_MISS';
  }

  /**
   * Identify which stage the failure occurred in
   * @param {Object} diagnosticData - Analysis from StageInspector
   */
  identifyFailureStage(diagnosticData) {
    const { stages, potential_issues } = diagnosticData;
    
    // Priority order: parse > buffer > replay
    if (stages.parse.empty_instruction_sets > 0 || 
        stages.parse.state_changes > 5) {
      return 'parse';
    }
    
    if (stages.buffer.timing_violations > 0) {
      return 'buffer';
    }
    
    if (potential_issues.some(i => i.type === 'STAGE_MISMATCH')) {
      // Determine which stage based on instruction count
      const parseCount = stages.parse.total_decisions;
      const replayCount = stages.replay.total_operations;
      
      if (parseCount > replayCount) {
        return 'replay'; // Replay didn't process all instructions
      } else {
        return 'parse'; // Parse generated wrong instructions
      }
    }
    
    return 'parse'; // Default to parse as most common
  }

  /**
   * Identify the specific pattern that caused failure
   * @param {Object} diagnosticData - Analysis from StageInspector
   * @param {Object} expected - Expected output
   * @param {Object} actual - Actual output
   */
  identifyPattern(diagnosticData, expected, actual) {
    const parseData = diagnosticData.stages.parse;
    
    // Look for specific patterns in parse instructions
    const instructionSequence = this.getInstructionSequence(diagnosticData);
    
    // Common failure patterns
    if (this.hasCodeBlockTransitionIssue(instructionSequence)) {
      return 'code-block-transition';
    }
    
    if (this.hasListTransitionIssue(instructionSequence)) {
      return 'list-transition';
    }
    
    if (this.hasTableDetectionIssue(parseData)) {
      return 'table-detection';
    }
    
    if (this.hasParagraphAccumulationIssue(parseData)) {
      return 'paragraph-accumulation';
    }
    
    // Default pattern based on content analysis
    return this.analyzeContentPattern(expected, actual);
  }

  /**
   * Get instruction sequence from diagnostic data
   */
  getInstructionSequence(diagnosticData) {
    // Access raw recordings instead of analyzed stages
    if (!diagnosticData.recordings || !diagnosticData.recordings.parse) {
      return [];
    }
    
    const sequence = [];
    diagnosticData.recordings.parse.forEach(record => {
      if (record.instructions) {
        record.instructions.forEach(inst => {
          sequence.push(inst.type);
        });
      }
    });
    return sequence;
  }

  /**
   * Check for code block transition issues
   */
  hasCodeBlockTransitionIssue(sequence) {
    // Look for paragraph followed by start_code_block without proper transition
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i] === 'paragraph' && 
          sequence[i + 1] === 'start_code_block') {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for list transition issues
   */
  hasListTransitionIssue(sequence) {
    // Look for direct transitions between different list types
    for (let i = 0; i < sequence.length - 1; i++) {
      if ((sequence[i] === 'unordered_list_item' && 
           sequence[i + 1] === 'ordered_list_item') ||
          (sequence[i] === 'ordered_list_item' && 
           sequence[i + 1] === 'unordered_list_item')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for table detection issues
   */
  hasTableDetectionIssue(parseData) {
    const hasTableStart = parseData.instruction_types?.start_table > 0;
    const hasTableEnd = parseData.instruction_types?.end_table > 0;
    
    return hasTableStart !== hasTableEnd;
  }

  /**
   * Check for paragraph accumulation issues
   */
  hasParagraphAccumulationIssue(parseData) {
    // Multiple empty instruction sets might indicate accumulation issues
    return parseData.empty_instruction_sets > 2;
  }

  /**
   * Analyze content pattern when no specific issue is found
   */
  analyzeContentPattern(expected, actual) {
    // This would compare expected vs actual to determine pattern
    // For now, return generic pattern
    return 'unknown-pattern';
  }

  /**
   * Update pattern frequency tracking
   */
  updatePatternFrequency(pattern) {
    const current = this.patterns.get(pattern) || 0;
    this.patterns.set(pattern, current + 1);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats() {
    const stats = [];
    
    for (const [pattern, frequency] of this.patterns) {
      const failures = this.classifications.filter(c => c.pattern === pattern);
      const stages = [...new Set(failures.map(f => f.stage))];
      const types = [...new Set(failures.map(f => f.failureType))];
      
      stats.push({
        pattern,
        frequency,
        percentage: (frequency / this.classifications.length * 100).toFixed(1),
        stages,
        types
      });
    }
    
    return stats.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get top patterns causing failures
   * @param {number} limit - Number of patterns to return
   */
  getTopPatterns(limit = 3) {
    return this.getPatternStats().slice(0, limit);
  }

  /**
   * Get classification summary
   */
  getSummary() {
    const summary = {
      total_failures: this.classifications.length,
      by_stage: {},
      by_type: {},
      top_patterns: this.getTopPatterns()
    };
    
    // Count by stage
    this.classifications.forEach(c => {
      summary.by_stage[c.stage] = (summary.by_stage[c.stage] || 0) + 1;
      summary.by_type[c.failureType] = (summary.by_type[c.failureType] || 0) + 1;
    });
    
    return summary;
  }

  /**
   * Get recommendations based on classifications
   */
  getRecommendations() {
    const topPatterns = this.getTopPatterns();
    const recommendations = [];
    
    topPatterns.forEach(pattern => {
      switch (pattern.pattern) {
        case 'code-block-transition':
          recommendations.push({
            pattern: pattern.pattern,
            priority: 'high',
            suggestion: 'Improve boundary detection before code blocks',
            location: 'Parser: processLine() method around line detection'
          });
          break;
          
        case 'paragraph-accumulation':
          recommendations.push({
            pattern: pattern.pattern,
            priority: 'medium',
            suggestion: 'Review paragraph accumulation logic',
            location: 'Parser: currentParagraph handling'
          });
          break;
          
        case 'list-transition':
          recommendations.push({
            pattern: pattern.pattern,
            priority: 'medium',
            suggestion: 'Improve list type transition handling',
            location: 'Parser: list item detection logic'
          });
          break;
          
        case 'table-detection':
          recommendations.push({
            pattern: pattern.pattern,
            priority: 'low',
            suggestion: 'Enhance table separator detection',
            location: 'Parser: isTableRow() and handleTableRow()'
          });
          break;
      }
    });
    
    return recommendations;
  }

  /**
   * Clear all classifications
   */
  reset() {
    this.classifications = [];
    this.patterns.clear();
  }
}

// Create singleton instance
export const failureClassifier = new FailureClassifier();
export default failureClassifier;