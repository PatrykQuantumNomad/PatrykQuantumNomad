import type { K8sLintRule } from '../../types';

import { KAC001 } from './KA-C001-privileged-container';
import { KAC002 } from './KA-C002-privilege-escalation';
import { KAC003 } from './KA-C003-runs-as-root';
import { KAC004 } from './KA-C004-missing-run-as-non-root';
import { KAC005 } from './KA-C005-uid-zero';
import { KAC006 } from './KA-C006-host-pid';
import { KAC007 } from './KA-C007-host-ipc';
import { KAC008 } from './KA-C008-host-network';
import { KAC009 } from './KA-C009-host-port';
import { KAC010 } from './KA-C010-dangerous-capabilities';
import { KAC011 } from './KA-C011-capabilities-not-dropped';
import { KAC012 } from './KA-C012-writable-filesystem';
import { KAC013 } from './KA-C013-missing-seccomp';
import { KAC014 } from './KA-C014-sensitive-host-path';
import { KAC015 } from './KA-C015-docker-socket-mount';
import { KAC016 } from './KA-C016-sa-token-automount';
import { KAC017 } from './KA-C017-default-service-account';
import { KAC018 } from './KA-C018-secrets-in-env';
import { KAC019 } from './KA-C019-default-namespace';
import { KAC020 } from './KA-C020-missing-security-context';

/** All 20 security rules for K8s manifest validation. */
export const securityRules: K8sLintRule[] = [
  KAC001,
  KAC002,
  KAC003,
  KAC004,
  KAC005,
  KAC006,
  KAC007,
  KAC008,
  KAC009,
  KAC010,
  KAC011,
  KAC012,
  KAC013,
  KAC014,
  KAC015,
  KAC016,
  KAC017,
  KAC018,
  KAC019,
  KAC020,
];
