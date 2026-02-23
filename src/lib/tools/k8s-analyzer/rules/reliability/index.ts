import type { K8sLintRule } from '../../types';

import { KAR001 } from './KA-R001-missing-liveness-probe';
import { KAR002 } from './KA-R002-missing-readiness-probe';
import { KAR003 } from './KA-R003-identical-probes';
import { KAR004 } from './KA-R004-single-replica';
import { KAR005 } from './KA-R005-missing-pdb';
import { KAR006 } from './KA-R006-no-rolling-update';
import { KAR007 } from './KA-R007-missing-anti-affinity';
import { KAR008 } from './KA-R008-missing-topology-spread';
import { KAR009 } from './KA-R009-latest-image-tag';
import { KAR010 } from './KA-R010-image-pull-policy';
import { KAR011 } from './KA-R011-selector-mismatch';
import { KAR012 } from './KA-R012-cronjob-missing-deadline';

/** All 12 reliability rules for K8s manifest validation. */
export const reliabilityRules: K8sLintRule[] = [
  KAR001,
  KAR002,
  KAR003,
  KAR004,
  KAR005,
  KAR006,
  KAR007,
  KAR008,
  KAR009,
  KAR010,
  KAR011,
  KAR012,
];
