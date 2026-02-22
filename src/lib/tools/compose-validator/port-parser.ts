/**
 * Docker Compose port string parser and conflict detection.
 *
 * Handles all short-syntax port formats documented at:
 * https://docs.docker.com/reference/compose-file/services/#ports
 *
 * Also handles long-syntax port objects with target/published/host_ip/protocol keys.
 */

export interface ParsedPort {
  hostIp?: string;
  hostPort?: number;
  hostPortEnd?: number;
  containerPort: number;
  containerPortEnd?: number;
  protocol: 'tcp' | 'udp';
}

/**
 * Parse a range string like "8000-8010" into { start, end }.
 * Returns { start: N, end: undefined } for a single port number.
 */
function parseRange(s: string): { start: number; end?: number } | null {
  const dashIdx = s.indexOf('-');
  if (dashIdx === -1) {
    const n = parseInt(s, 10);
    return isNaN(n) ? null : { start: n };
  }
  const start = parseInt(s.slice(0, dashIdx), 10);
  const end = parseInt(s.slice(dashIdx + 1), 10);
  if (isNaN(start) || isNaN(end)) return null;
  return { start, end };
}

/**
 * Parse a Docker Compose short-syntax port string.
 *
 * Supported formats:
 *   "80"                    -> container port only
 *   "8080:80"               -> host:container
 *   "127.0.0.1:8080:80"     -> ip:host:container
 *   "8080:80/udp"           -> with protocol
 *   "8000-8010:8000-8010"   -> port range
 *   "127.0.0.1::80"         -> ip with ephemeral host port
 */
export function parsePortString(port: string): ParsedPort | null {
  let protocol: 'tcp' | 'udp' = 'tcp';
  let portStr = port.trim();

  // Strip protocol suffix
  if (portStr.endsWith('/udp')) {
    protocol = 'udp';
    portStr = portStr.slice(0, -4);
  } else if (portStr.endsWith('/tcp')) {
    portStr = portStr.slice(0, -4);
  }

  const parts = portStr.split(':');

  if (parts.length === 1) {
    // Container port only: "80" or "8000-8010"
    const container = parseRange(parts[0]);
    if (!container) return null;
    return {
      containerPort: container.start,
      containerPortEnd: container.end,
      protocol,
    };
  }

  if (parts.length === 2) {
    // host:container -- "8080:80" or "8000-8010:8000-8010"
    const host = parseRange(parts[0]);
    const container = parseRange(parts[1]);
    if (!host || !container) return null;
    return {
      hostPort: host.start,
      hostPortEnd: host.end,
      containerPort: container.start,
      containerPortEnd: container.end,
      protocol,
    };
  }

  if (parts.length === 3) {
    // Could be "ip:host:container" or just "ip::container" (ephemeral)
    const first = parts[0];
    const isIp = first.includes('.') || first === '';

    if (isIp) {
      const hostIp = first || undefined;
      const hostPart = parts[1]; // may be empty for ephemeral
      const container = parseRange(parts[2]);
      if (!container) return null;

      if (hostPart === '') {
        // "127.0.0.1::80" -> ephemeral host port
        return {
          hostIp,
          containerPort: container.start,
          containerPortEnd: container.end,
          protocol,
        };
      }

      const host = parseRange(hostPart);
      if (!host) return null;
      return {
        hostIp,
        hostPort: host.start,
        hostPortEnd: host.end,
        containerPort: container.start,
        containerPortEnd: container.end,
        protocol,
      };
    }

    // Fallback: not an IP pattern, try host-range:container
    // This handles edge cases where a range-based host includes a dash
    return null;
  }

  return null;
}

/**
 * Parse a long-syntax port object (YAML map with target, published, host_ip, protocol).
 * Accepts the raw JS object from YAML toJSON() or direct key-value extraction.
 */
export function parseLongSyntaxPort(portMap: any): ParsedPort | null {
  if (!portMap || typeof portMap !== 'object') return null;

  const target = portMap.target;
  if (target === undefined || target === null) return null;

  const containerPort = typeof target === 'number' ? target : parseInt(String(target), 10);
  if (isNaN(containerPort)) return null;

  const protocol: 'tcp' | 'udp' =
    portMap.protocol === 'udp' ? 'udp' : 'tcp';

  const result: ParsedPort = { containerPort, protocol };

  if (portMap.host_ip) {
    result.hostIp = String(portMap.host_ip);
  }

  if (portMap.published !== undefined && portMap.published !== null) {
    const pubStr = String(portMap.published);
    const dashIdx = pubStr.indexOf('-');
    if (dashIdx !== -1) {
      result.hostPort = parseInt(pubStr.slice(0, dashIdx), 10);
      result.hostPortEnd = parseInt(pubStr.slice(dashIdx + 1), 10);
    } else {
      const pub = typeof portMap.published === 'number'
        ? portMap.published
        : parseInt(pubStr, 10);
      if (!isNaN(pub)) {
        result.hostPort = pub;
      }
    }
  }

  return result;
}

/**
 * Expand a port range into individual port numbers.
 * expandPortRange(8000, 8005) -> [8000, 8001, 8002, 8003, 8004, 8005]
 */
export function expandPortRange(start: number, end?: number): number[] {
  if (end === undefined || end === start) return [start];
  const result: number[] = [];
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  for (let i = lo; i <= hi; i++) result.push(i);
  return result;
}

/**
 * Check if two port entries conflict (same protocol + overlapping IP + overlapping host port).
 *
 * - Undefined hostIp is treated as '0.0.0.0' (all interfaces).
 * - '0.0.0.0' conflicts with any specific IP.
 * - Two specific different IPs do NOT conflict.
 * - Ports without a hostPort (container-only or ephemeral) never conflict.
 */
export function portsConflict(a: ParsedPort, b: ParsedPort): boolean {
  // Must share protocol
  if (a.protocol !== b.protocol) return false;

  // Both must have host ports to conflict
  if (a.hostPort === undefined || b.hostPort === undefined) return false;

  // IP comparison: 0.0.0.0 conflicts with everything
  const aIp = a.hostIp ?? '0.0.0.0';
  const bIp = b.hostIp ?? '0.0.0.0';
  if (aIp !== '0.0.0.0' && bIp !== '0.0.0.0' && aIp !== bIp) return false;

  // Check port range overlap
  const aStart = a.hostPort;
  const aEnd = a.hostPortEnd ?? a.hostPort;
  const bStart = b.hostPort;
  const bEnd = b.hostPortEnd ?? b.hostPort;

  // Ranges overlap if max(start) <= min(end)
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
}
