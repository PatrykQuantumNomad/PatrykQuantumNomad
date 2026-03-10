/**
 * DIAG-04: MCP Architecture Topology
 *
 * Generates a build-time SVG showing how Claude Code connects to MCP
 * servers via stdio (local) and HTTP/SSE (remote) transports, with
 * configuration scopes (local, project, user) and server sources.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
  groupBox,
} from './diagram-base';

const MARKER_ID = 'mcp-arrow';

/** Generate the MCP Architecture topology SVG diagram */
export function generateMcpArchitecture(): string {
  const config: DiagramConfig = { width: 720, height: 550, fontFamily: "'DM Sans', sans-serif" };
  const parts: string[] = [];

  // -- SVG open --
  parts.push(
    diagramSvgOpen(
      config,
      'MCP architecture: server topology with stdio and HTTP transport connections across local, project, and user scopes',
    ),
  );

  // -- Arrow marker --
  parts.push(arrowMarkerDef(MARKER_ID));

  // =========================================================
  // Layout constants
  // =========================================================
  const centerX = config.width / 2;

  // -- Top: Server Sources --
  const sourceY = 20;
  const sources = ['user-configured', 'plugin-provided', 'claude.ai-synced', 'managed (admin)'];
  const sourceBadgeW = 120;
  const sourceBadgeH = 22;
  const sourceSpacing = 140;
  const sourceStartX = centerX - ((sources.length - 1) * sourceSpacing) / 2;

  parts.push(
    textLabel(centerX, sourceY, 'Server Sources', {
      fontSize: 12,
      fontWeight: 'bold',
    }),
  );

  for (let i = 0; i < sources.length; i++) {
    const sx = sourceStartX + i * sourceSpacing - sourceBadgeW / 2;
    const sy = sourceY + 8;
    parts.push(
      roundedRect(sx, sy, sourceBadgeW, sourceBadgeH, {
        fill: DIAGRAM_PALETTE.surface,
        stroke: DIAGRAM_PALETTE.border,
        rx: 3,
        strokeWidth: 1,
      }),
    );
    parts.push(
      textLabel(sourceStartX + i * sourceSpacing, sy + sourceBadgeH / 2 + 4, sources[i], {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );
  }

  // =========================================================
  // Center: Claude Code hub
  // =========================================================
  const hubW = 180;
  const hubH = 60;
  const hubX = centerX - hubW / 2;
  const hubY = 190;

  parts.push(
    roundedRect(hubX, hubY, hubW, hubH, {
      fill: DIAGRAM_PALETTE.surface,
      stroke: DIAGRAM_PALETTE.accent,
      strokeWidth: 2.5,
      rx: 10,
    }),
  );
  parts.push(
    textLabel(centerX, hubY + hubH / 2 + 6, 'Claude Code', {
      fontSize: 18,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.accent,
    }),
  );

  // =========================================================
  // Left: Local Servers group
  // =========================================================
  const localGroupX = 30;
  const localGroupY = 100;
  const localGroupW = 200;
  const localGroupH = 190;

  parts.push(groupBox(localGroupX, localGroupY, localGroupW, localGroupH, 'Local Servers'));

  // stdio transport badge
  const stdioX = localGroupX + 30;
  const stdioY = localGroupY + 40;
  const stdioW = 140;
  const stdioH = 34;

  parts.push(
    roundedRect(stdioX, stdioY, stdioW, stdioH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 5,
    }),
  );
  parts.push(
    textLabel(stdioX + stdioW / 2, stdioY + 15, 'stdio', {
      fontSize: 13,
      fontWeight: 'bold',
    }),
  );
  parts.push(
    textLabel(stdioX + stdioW / 2, stdioY + 28, 'Process I/O', {
      fontSize: 9,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // Note below
  parts.push(
    textLabel(localGroupX + localGroupW / 2, localGroupY + localGroupH - 30, 'Direct system access', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // Server example rects
  const serverRectW = 120;
  const serverRectH = 28;
  const serverRectX = localGroupX + (localGroupW - serverRectW) / 2;
  const serverRectY = stdioY + stdioH + 16;

  parts.push(
    roundedRect(serverRectX, serverRectY, serverRectW, serverRectH, {
      fill: DIAGRAM_PALETTE.surface,
      stroke: DIAGRAM_PALETTE.border,
      rx: 4,
      strokeWidth: 1,
    }),
  );
  parts.push(
    textLabel(serverRectX + serverRectW / 2, serverRectY + serverRectH / 2 + 4, 'Local MCP Server', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // Arrow from local group to Claude Code center
  parts.push(arrowLine(localGroupX + localGroupW, hubY + hubH / 2, hubX - 4, hubY + hubH / 2, MARKER_ID));

  // =========================================================
  // Right: Remote Servers group
  // =========================================================
  const remoteGroupX = 490;
  const remoteGroupY = 100;
  const remoteGroupW = 200;
  const remoteGroupH = 190;

  parts.push(groupBox(remoteGroupX, remoteGroupY, remoteGroupW, remoteGroupH, 'Remote Servers'));

  // HTTP transport badge (recommended)
  const httpX = remoteGroupX + 30;
  const httpY = remoteGroupY + 40;
  const httpW = 140;
  const httpH = 34;

  parts.push(
    roundedRect(httpX, httpY, httpW, httpH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.accent,
      strokeWidth: 2,
      rx: 5,
    }),
  );
  parts.push(
    textLabel(httpX + httpW / 2, httpY + 15, 'HTTP', {
      fontSize: 13,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.accent,
    }),
  );
  parts.push(
    textLabel(httpX + httpW / 2, httpY + 28, 'Recommended', {
      fontSize: 9,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // SSE transport badge (deprecated)
  const sseX = remoteGroupX + 30;
  const sseY = httpY + httpH + 14;
  const sseW = 140;
  const sseH = 34;

  parts.push(
    roundedRect(sseX, sseY, sseW, sseH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 5,
      strokeWidth: 1,
    }),
  );
  parts.push(
    textLabel(sseX + sseW / 2, sseY + 15, 'SSE', {
      fontSize: 13,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );
  parts.push(
    textLabel(sseX + sseW / 2, sseY + 28, '(deprecated)', {
      fontSize: 9,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // Remote server example
  const remoteServerX = remoteGroupX + (remoteGroupW - serverRectW) / 2;
  const remoteServerY = sseY + sseH + 14;

  parts.push(
    roundedRect(remoteServerX, remoteServerY, serverRectW, serverRectH, {
      fill: DIAGRAM_PALETTE.surface,
      stroke: DIAGRAM_PALETTE.border,
      rx: 4,
      strokeWidth: 1,
    }),
  );
  parts.push(
    textLabel(remoteServerX + serverRectW / 2, remoteServerY + serverRectH / 2 + 4, 'Remote MCP Server', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // Arrow from remote group to Claude Code center
  parts.push(arrowLine(remoteGroupX, hubY + hubH / 2, hubX + hubW + 4, hubY + hubH / 2, MARKER_ID));

  // =========================================================
  // Bottom: Configuration Scopes
  // =========================================================
  const scopeY = 330;
  const scopeBoxW = 170;
  const scopeBoxH = 50;
  const scopeSpacing = 200;
  const scopeStartX = centerX - scopeSpacing;

  parts.push(
    textLabel(centerX, scopeY - 8, 'Configuration Scopes', {
      fontSize: 13,
      fontWeight: 'bold',
    }),
  );

  const scopes = [
    { name: 'Local', sub: 'Private, current project' },
    { name: 'Project', sub: '.mcp.json in VCS' },
    { name: 'User', sub: 'Cross-project' },
  ];

  for (let i = 0; i < scopes.length; i++) {
    const sx = scopeStartX + i * scopeSpacing - scopeBoxW / 2;
    parts.push(
      roundedRect(sx, scopeY, scopeBoxW, scopeBoxH, {
        fill: DIAGRAM_PALETTE.surfaceAlt,
        stroke: DIAGRAM_PALETTE.border,
        rx: 6,
      }),
    );
    parts.push(
      textLabel(scopeStartX + i * scopeSpacing, scopeY + 20, scopes[i].name, {
        fontSize: 13,
        fontWeight: 'bold',
      }),
    );
    parts.push(
      textLabel(scopeStartX + i * scopeSpacing, scopeY + 36, scopes[i].sub, {
        fontSize: 10,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );
  }

  // Arrows from hub down to scopes
  for (let i = 0; i < scopes.length; i++) {
    const targetX = scopeStartX + i * scopeSpacing;
    parts.push(arrowLine(centerX, hubY + hubH, targetX, scopeY - 2, MARKER_ID));
  }

  // =========================================================
  // Features callout (bottom area)
  // =========================================================
  const featY = 420;
  const features = ['OAuth 2.0', 'Tool search', 'MCP resources', 'MCP prompts'];
  const featBadgeW = 100;
  const featBadgeH = 22;
  const featSpacing = 130;
  const featStartX = centerX - ((features.length - 1) * featSpacing) / 2;

  parts.push(
    textLabel(centerX, featY - 8, 'Capabilities', {
      fontSize: 12,
      fontWeight: 'bold',
    }),
  );

  for (let i = 0; i < features.length; i++) {
    const fx = featStartX + i * featSpacing - featBadgeW / 2;
    parts.push(
      roundedRect(fx, featY, featBadgeW, featBadgeH, {
        fill: DIAGRAM_PALETTE.surface,
        stroke: DIAGRAM_PALETTE.border,
        rx: 3,
        strokeWidth: 1,
      }),
    );
    parts.push(
      textLabel(featStartX + i * featSpacing, featY + featBadgeH / 2 + 4, features[i], {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );
  }

  // =========================================================
  // Close SVG
  // =========================================================
  parts.push('</svg>');
  return parts.join('\n');
}
