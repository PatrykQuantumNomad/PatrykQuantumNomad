import type { ComposeLintRule } from '../../types';

import { CVC001 } from './CV-C001-privileged-mode';
import { CVC002 } from './CV-C002-docker-socket-mount';
import { CVC003 } from './CV-C003-host-network-mode';
import { CVC004 } from './CV-C004-host-pid-mode';
import { CVC005 } from './CV-C005-host-ipc-mode';
import { CVC006 } from './CV-C006-dangerous-capabilities';
import { CVC007 } from './CV-C007-default-capabilities-not-dropped';
import { CVC008 } from './CV-C008-secrets-in-environment';
import { CVC009 } from './CV-C009-unbound-port-interface';
import { CVC010 } from './CV-C010-missing-no-new-privileges';
import { CVC011 } from './CV-C011-writable-filesystem';
import { CVC012 } from './CV-C012-seccomp-disabled';
import { CVC013 } from './CV-C013-selinux-disabled';
import { CVC014 } from './CV-C014-image-latest-no-tag';

/** All 14 security rules for Docker Compose validation. */
export const securityRules: ComposeLintRule[] = [
  CVC001,
  CVC002,
  CVC003,
  CVC004,
  CVC005,
  CVC006,
  CVC007,
  CVC008,
  CVC009,
  CVC010,
  CVC011,
  CVC012,
  CVC013,
  CVC014,
];
