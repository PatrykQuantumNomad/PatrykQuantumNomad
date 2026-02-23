import type { K8sLintRule } from '../../types';

import { KAX001 } from './KA-X001-service-selector-mismatch';
import { KAX002 } from './KA-X002-ingress-undefined-service';
import { KAX003 } from './KA-X003-configmap-not-found';
import { KAX004 } from './KA-X004-secret-not-found';
import { KAX005 } from './KA-X005-pvc-not-found';
import { KAX006 } from './KA-X006-serviceaccount-not-found';
import { KAX007 } from './KA-X007-networkpolicy-no-match';
import { KAX008 } from './KA-X008-hpa-target-not-found';

/** All 8 cross-resource validation rules for K8s manifest analysis. */
export const crossResourceRules: K8sLintRule[] = [
  KAX001,
  KAX002,
  KAX003,
  KAX004,
  KAX005,
  KAX006,
  KAX007,
  KAX008,
];
