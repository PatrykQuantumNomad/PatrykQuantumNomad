import type { K8sLintRule } from '../../types';

import { KAA001 } from './KA-A001-wildcard-permissions';
import { KAA002 } from './KA-A002-cluster-admin-binding';
import { KAA003 } from './KA-A003-pod-exec-attach';
import { KAA004 } from './KA-A004-secret-access';
import { KAA005 } from './KA-A005-pod-creation';

/** All 5 RBAC analysis rules for K8s manifest validation. */
export const rbacRules: K8sLintRule[] = [
  KAA001,
  KAA002,
  KAA003,
  KAA004,
  KAA005,
];
