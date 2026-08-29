import { AnalogyEngine, AnalogyDefinition } from './analogyEngine';
import { DebuggingCoach } from './debuggingCoach';
import { HintSystem, ProgressiveHintSet } from './hintSystem';
import { ErrorExplainer } from './errorExplainer';
import { ConceptExplainer } from './conceptExplainer';
import { PracticeGenerator, PracticeChallenge } from './practiceGenerator';
import { CodeMetrics, CodeSmell, SupportedLanguage } from '../../types';

export class LearningEngine {
  public static Analogy = AnalogyEngine;
  public static Debugging = DebuggingCoach;
  public static Hints = HintSystem;
  public static Errors = ErrorExplainer;
  public static Concepts = ConceptExplainer;
  public static Practice = PracticeGenerator;

  /**
   * Explains a programming concept with everyday analogies and structured progression
   */
  public static explainConcept(concept: string, language?: string, depth: 1 | 2 | 3 | 4 = 2): string {
    return ConceptExplainer.explain({ concept, language, depthLevel: depth });
  }

  /**
   * Generates a step-by-step code walkthrough
   */
  public static explainStepByStep(code: string, language: string = 'python'): string {
    return ConceptExplainer.generateStepByStep(code, language);
  }

  /**
   * Generates a patient debugging guide for a detected code smell
   */
  public static guideDebugging(smell: CodeSmell, codeSnippet: string, language: string): string {
    return DebuggingCoach.formatDebuggingGuide(smell, codeSnippet, language);
  }

  /**
   * Progressive hint generator
   */
  public static getHints(smell: CodeSmell, language: string = 'python'): ProgressiveHintSet {
    return HintSystem.generateHintsForSmell(smell, language);
  }

  /**
   * Generates a practice challenge for the active language
   */
  public static generatePractice(language: SupportedLanguage, metrics?: CodeMetrics): PracticeChallenge {
    return PracticeGenerator.generateChallenge(language, metrics);
  }
}
