import { describe, it, expect } from 'vitest'
import type { AttendanceStatus, EvaluationSignal, UserRole } from './enums'

const ATTENDANCE_VALUES: AttendanceStatus[] = ['present', 'absent', 'injured', 'late', 'trial']
const EVALUATION_VALUES: EvaluationSignal[] = ['positive', 'attention', 'none']
const USER_ROLE_VALUES: UserRole[] = [
  'admin',
  'coach',
  'parent',
  'child',
  'club',
  'commercial',
  'manager',
  'marketeur',
]

describe('@aureak/types — enums', () => {
  it('AttendanceStatus couvre les 5 valeurs exactes', () => {
    expect(ATTENDANCE_VALUES).toHaveLength(5)
    expect(ATTENDANCE_VALUES).toContain('present')
    expect(ATTENDANCE_VALUES).toContain('absent')
    expect(ATTENDANCE_VALUES).toContain('injured')
    expect(ATTENDANCE_VALUES).toContain('late')
    expect(ATTENDANCE_VALUES).toContain('trial')
    expect(ATTENDANCE_VALUES).not.toContain('unknown')
  })

  it('EvaluationSignal ne contient pas "absent" (rouge interdit en évaluation)', () => {
    expect(EVALUATION_VALUES).not.toContain('absent')
    expect(EVALUATION_VALUES).toHaveLength(3)
    expect(EVALUATION_VALUES).toContain('positive')
    expect(EVALUATION_VALUES).toContain('attention')
    expect(EVALUATION_VALUES).toContain('none')
  })

  it('UserRole couvre les 8 valeurs (7 rôles humains + club)', () => {
    expect(USER_ROLE_VALUES).toHaveLength(8) // 7 rôles humains + 1 rôle organisationnel (club)
    USER_ROLE_VALUES.forEach((role) => expect(typeof role).toBe('string'))
    expect(USER_ROLE_VALUES).toContain('admin')
    expect(USER_ROLE_VALUES).toContain('coach')
    expect(USER_ROLE_VALUES).toContain('parent')
    expect(USER_ROLE_VALUES).toContain('child')
    expect(USER_ROLE_VALUES).toContain('club')
    expect(USER_ROLE_VALUES).toContain('commercial')
    expect(USER_ROLE_VALUES).toContain('manager')
    expect(USER_ROLE_VALUES).toContain('marketeur')
  })
})
