import type { ComposeLintRule } from '../../types';

import { CVF001 } from './CV-F001-services-not-alphabetical';
import { CVF002 } from './CV-F002-ports-not-quoted';
import { CVF003 } from './CV-F003-inconsistent-port-quoting';

/** All 3 style rules for Docker Compose validation. */
export const styleRules: ComposeLintRule[] = [CVF001, CVF002, CVF003];
