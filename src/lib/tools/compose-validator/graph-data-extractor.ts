/**
 * Extracts image, port, and network metadata from parsed compose JSON
 * for enriching React Flow graph nodes.
 *
 * Separate from graph-builder.ts which handles dependency relationships
 * and cycle detection from the YAML AST. This module reads the JSON
 * output for display-only metadata (GRAPH-02, GRAPH-05).
 */

export interface EnrichedServiceNode {
  name: string;
  image?: string;
  portSummary?: string;
  networks: string[];
}

/**
 * Extract image, port summary, and network membership for each service.
 *
 * Handles both forms of networks:
 *   Array form: networks: [frontend, backend]
 *   Map form:   networks: { frontend: { aliases: [...] } }
 *
 * Port summary shows up to 3 ports as comma-separated strings.
 */
export function extractServiceMetadata(
  json: Record<string, unknown>,
): Map<string, EnrichedServiceNode> {
  const result = new Map<string, EnrichedServiceNode>();
  const services = json.services as Record<string, any> | undefined;
  if (!services || typeof services !== 'object') return result;

  for (const [name, svc] of Object.entries(services)) {
    if (!svc || typeof svc !== 'object') continue;

    const image = typeof svc.image === 'string' ? svc.image : undefined;

    const ports = Array.isArray(svc.ports)
      ? svc.ports
          .map((p: any) => String(p))
          .slice(0, 3)
          .join(', ')
      : undefined;

    const networks = svc.networks
      ? Array.isArray(svc.networks)
        ? svc.networks.map(String)
        : typeof svc.networks === 'object'
          ? Object.keys(svc.networks)
          : []
      : [];

    result.set(name, {
      name,
      image,
      portSummary: ports,
      networks,
    });
  }

  return result;
}
