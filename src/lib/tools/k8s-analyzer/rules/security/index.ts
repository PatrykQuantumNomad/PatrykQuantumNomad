import type { K8sLintRule } from '../../types';

import { KAC001 } from './KA-C001-privileged-container';
import { KAC002 } from './KA-C002-privilege-escalation';
import { KAC003 } from './KA-C003-runs-as-root';
import { KAC004 } from './KA-C004-missing-run-as-non-root';
import { KAC005 } from './KA-C005-uid-zero';
import { KAC009 } from './KA-C009-host-port';
import { KAC010 } from './KA-C010-dangerous-capabilities';
import { KAC011 } from './KA-C011-capabilities-not-dropped';
import { KAC012 } from './KA-C012-writable-filesystem';
import { KAC013 } from './KA-C013-missing-seccomp';

/** All security rules for K8s manifest validation. */
export const securityRules: K8sLintRule[] = [
  KAC001,
  KAC002,
  KAC003,
  KAC004,
  KAC005,
  KAC009,
  KAC010,
  KAC011,
  KAC012,
  KAC013,
];
