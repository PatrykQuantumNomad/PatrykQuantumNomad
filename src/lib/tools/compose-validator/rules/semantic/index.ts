import type { ComposeLintRule } from '../../types';

import { CVM001 } from './CV-M001-duplicate-ports';
import { CVM002 } from './CV-M002-circular-depends-on';
import { CVM003 } from './CV-M003-undefined-network';
import { CVM004 } from './CV-M004-undefined-volume';
import { CVM005 } from './CV-M005-undefined-secret';
import { CVM006 } from './CV-M006-undefined-config';
import { CVM007 } from './CV-M007-orphan-network';
import { CVM008 } from './CV-M008-orphan-volume';
import { CVM009 } from './CV-M009-orphan-secret';
import { CVM010 } from './CV-M010-depends-on-healthy-no-healthcheck';
import { CVM011 } from './CV-M011-self-referencing-dependency';
import { CVM012 } from './CV-M012-undefined-service-dependency';
import { CVM013 } from './CV-M013-duplicate-container-names';
import { CVM014 } from './CV-M014-port-range-overlap';
import { CVM015 } from './CV-M015-invalid-image-reference';

// Semantic rule registry -- all 15 semantic rules exported as a flat array
export const semanticRules: ComposeLintRule[] = [
  CVM001,
  CVM002,
  CVM003,
  CVM004,
  CVM005,
  CVM006,
  CVM007,
  CVM008,
  CVM009,
  CVM010,
  CVM011,
  CVM012,
  CVM013,
  CVM014,
  CVM015,
];
