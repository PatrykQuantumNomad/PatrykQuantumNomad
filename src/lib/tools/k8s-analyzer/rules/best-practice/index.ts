import type { K8sLintRule } from '../../types';

import { KAB001 } from './KA-B001-missing-cpu-requests';
import { KAB002 } from './KA-B002-missing-cpu-limits';
import { KAB003 } from './KA-B003-missing-memory-requests';
import { KAB004 } from './KA-B004-missing-memory-limits';
import { KAB005 } from './KA-B005-missing-labels';
import { KAB006 } from './KA-B006-missing-namespace';
import { KAB007 } from './KA-B007-ssh-port-exposed';
import { KAB008 } from './KA-B008-nodeport-service';
import { KAB009 } from './KA-B009-liveness-probe-port';
import { KAB010 } from './KA-B010-readiness-probe-port';
import { KAB011 } from './KA-B011-missing-priority-class';
import { KAB012 } from './KA-B012-duplicate-env-keys';

/** All 12 best practice rules for K8s manifest validation. */
export const bestPracticeRules: K8sLintRule[] = [
  KAB001,
  KAB002,
  KAB003,
  KAB004,
  KAB005,
  KAB006,
  KAB007,
  KAB008,
  KAB009,
  KAB010,
  KAB011,
  KAB012,
];
