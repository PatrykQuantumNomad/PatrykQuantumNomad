/**
 * Well-known Kubernetes resources that exist implicitly in every namespace.
 *
 * These Sets prevent false positives in cross-resource validation rules
 * by allowing rules to skip references to system-managed resources that
 * won't appear in user manifests but are guaranteed to exist at runtime.
 */

/** ConfigMaps auto-created by Kubernetes controllers in every namespace. */
export const WELL_KNOWN_CONFIGMAPS = new Set<string>([
  'kube-root-ca.crt', // rootcacertpublisher controller
]);

/** ServiceAccounts auto-created by Kubernetes in every namespace. */
export const WELL_KNOWN_SERVICE_ACCOUNTS = new Set<string>([
  'default', // auto-created per namespace
]);

/** Secrets that are universally well-known (none currently). */
export const WELL_KNOWN_SECRETS = new Set<string>();

/** Services that are universally well-known in user namespaces (none currently). */
export const WELL_KNOWN_SERVICES = new Set<string>();

/** PVCs that are universally well-known (none currently). */
export const WELL_KNOWN_PVCS = new Set<string>();
