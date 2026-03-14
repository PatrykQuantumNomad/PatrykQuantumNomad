import { describe, it, expect } from 'vitest';
import { REQUIREMENTS_TXT } from '../requirements';
import { THEME_SETUP_CODE, DEPENDENCY_CHECK_CODE } from '../theme';

describe('REQUIREMENTS_TXT', () => {
  it('contains numpy>=2.0.0', () => {
    expect(REQUIREMENTS_TXT).toContain('numpy>=2.0.0');
  });

  it('contains scipy>=1.14.0', () => {
    expect(REQUIREMENTS_TXT).toContain('scipy>=1.14.0');
  });

  it('contains pandas>=2.2.0', () => {
    expect(REQUIREMENTS_TXT).toContain('pandas>=2.2.0');
  });

  it('contains matplotlib>=3.9.0', () => {
    expect(REQUIREMENTS_TXT).toContain('matplotlib>=3.9.0');
  });

  it('contains seaborn>=0.13.0', () => {
    expect(REQUIREMENTS_TXT).toContain('seaborn>=0.13.0');
  });

  it('has exactly 5 non-empty lines', () => {
    const nonEmptyLines = REQUIREMENTS_TXT.split('\n').filter((line) => line.trim().length > 0);
    expect(nonEmptyLines).toHaveLength(5);
  });

  it('ends with a trailing newline', () => {
    expect(REQUIREMENTS_TXT.endsWith('\n')).toBe(true);
  });

  it('uses >= (floor pins), not == (exact pins)', () => {
    expect(REQUIREMENTS_TXT).not.toContain('==');
  });
});

describe('THEME_SETUP_CODE', () => {
  it('is an array of strings', () => {
    expect(Array.isArray(THEME_SETUP_CODE)).toBe(true);
    expect(THEME_SETUP_CODE.length).toBeGreaterThan(0);
  });

  it('contains plt.rcParams', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('plt.rcParams');
  });

  it('contains background color #0f1117', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('#0f1117');
  });

  it('contains sns.set_theme', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('sns.set_theme');
  });

  it('contains accent color #e06040', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('#e06040');
  });

  it('contains surface color #1a1d27', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('#1a1d27');
  });

  it('contains teal color #00a3a3', () => {
    const joined = THEME_SETUP_CODE.join('\n');
    expect(joined).toContain('#00a3a3');
  });
});

describe('DEPENDENCY_CHECK_CODE', () => {
  it('is an array of strings', () => {
    expect(Array.isArray(DEPENDENCY_CHECK_CODE)).toBe(true);
    expect(DEPENDENCY_CHECK_CODE.length).toBeGreaterThan(0);
  });

  it('contains try', () => {
    const joined = DEPENDENCY_CHECK_CODE.join('\n');
    expect(joined).toContain('try');
  });

  it('contains import', () => {
    const joined = DEPENDENCY_CHECK_CODE.join('\n');
    expect(joined).toContain('import');
  });

  it('contains pip install', () => {
    const joined = DEPENDENCY_CHECK_CODE.join('\n');
    expect(joined).toContain('pip install');
  });
});
