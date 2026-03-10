/**
 * SVG Diagram Generator Library -- barrel export.
 * Re-exports all 3 architecture diagram generators and shared types.
 */

// Diagram generators
export { generateMiddlewareStack } from './middleware-stack';
export { generateBuilderPattern } from './builder-pattern';
export { generateJwtAuthFlow } from './jwt-auth-flow';
export { generateNfrDiagram } from './nfr-diagram';
export { generateAgenticLoop } from './agentic-loop';
export { generateHookLifecycle } from './hook-lifecycle';
export { generatePermissionModel } from './permission-model';

// Shared types and utilities
export { DIAGRAM_PALETTE, DEFAULT_DIAGRAM_CONFIG, type DiagramConfig } from './diagram-base';
