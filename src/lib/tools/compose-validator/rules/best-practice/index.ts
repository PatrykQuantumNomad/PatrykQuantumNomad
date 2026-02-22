import type { ComposeLintRule } from '../../types';

import { CVB001 } from './CV-B001-missing-healthcheck';
import { CVB002 } from './CV-B002-no-restart-policy';
import { CVB003 } from './CV-B003-no-resource-limits';
import { CVB004 } from './CV-B004-image-tag-not-pinned';
import { CVB005 } from './CV-B005-no-logging-config';
import { CVB006 } from './CV-B006-deprecated-version-field';
import { CVB007 } from './CV-B007-missing-project-name';
import { CVB008 } from './CV-B008-build-and-image';
import { CVB009 } from './CV-B009-anonymous-volume';
import { CVB010 } from './CV-B010-no-memory-reservation';
import { CVB011 } from './CV-B011-healthcheck-timeout-exceeds-interval';
import { CVB012 } from './CV-B012-default-network-only';

/** All 12 best practice rules for Docker Compose validation. */
export const bestPracticeRules: ComposeLintRule[] = [
  CVB001,
  CVB002,
  CVB003,
  CVB004,
  CVB005,
  CVB006,
  CVB007,
  CVB008,
  CVB009,
  CVB010,
  CVB011,
  CVB012,
];
