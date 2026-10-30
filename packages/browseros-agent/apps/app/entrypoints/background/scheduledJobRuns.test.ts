import { describe, expect, it, mock } from 'bun:test'

// Setup globalThis.chrome before importing extension modules
;(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    id: 'test-extension-id',
    onStartup: { addListener: mock() },
    onInstalled: { addListener: mock() },
    onMessage: { addListener: mock(), removeListener: mock() },
    getPlatformInfo: mock(() => Promise.resolve({})),
  },
  idle: {
    onStateChanged: { addListener: mock() },
  },
  alarms: {
    get: mock(() => Promise.resolve(null)),
    getAll: mock(() => Promise.resolve([])),
    create: mock(),
    clear: mock(),
    onAlarm: { addListener: mock() },
  },
  storage: {
    local: {
      get: mock(() => Promise.resolve({})),
      set: mock(() => Promise.resolve()),
      remove: mock(() => Promise.resolve()),
      clear: mock(() => Promise.resolve()),
      onChanged: { addListener: mock(), removeListener: mock() },
    },
    sync: {
      get: mock(() => Promise.resolve({})),
      set: mock(() => Promise.resolve()),
      remove: mock(() => Promise.resolve()),
      clear: mock(() => Promise.resolve()),
      onChanged: { addListener: mock(), removeListener: mock() },
    },
    onChanged: { addListener: mock(), removeListener: mock() },
  },
  tabs: {
    onCreated: { addListener: mock(), removeListener: mock() },
    remove: mock(() => Promise.resolve()),
  },
}

const { getNextRunTime, isJobDue, scheduledJobRuns } = await import(
  './scheduledJobRuns'
)

import type {
  ScheduledJob,
  ScheduledJobRun,
} from '@/lib/schedules/scheduleTypes'

describe('scheduledJobRuns - getNextRunTime & isJobDue', () => {
  const fixedNow = new Date('2026-09-13T14:30:00.000Z').getTime()

  it('calculates nextRun for daily job after previous run', () => {
    const job: ScheduledJob = {
      id: 'job-1',
      name: 'Daily Job',
      query: 'Check reports',
      scheduleType: 'daily',
      scheduleTime: '09:00',
      enabled: true,
      createdAt: '2026-09-10T08:00:00.000Z',
      updatedAt: '2026-09-10T08:00:00.000Z',
      lastRunAt: '2026-09-12T09:00:00.000Z',
    }

    const nextRun = getNextRunTime(job, fixedNow)
    expect(nextRun).not.toBeNull()
    if (!nextRun) throw new Error('Expected nextRun to be defined')

    // Next run was scheduled for Sep 13 at 09:00, which is in the past compared to 14:30
    const nextDate = new Date(nextRun)
    expect(nextDate.getHours()).toBe(9)
    expect(nextDate.getMinutes()).toBe(0)
    expect(nextRun).toBeLessThan(fixedNow)

    // isJobDue should detect the missed run
    expect(isJobDue(job, [], fixedNow)).toBe(true)
  })

  it('returns false for daily job that already ran today', () => {
    const job: ScheduledJob = {
      id: 'job-1',
      name: 'Daily Job',
      query: 'Check reports',
      scheduleType: 'daily',
      scheduleTime: '09:00',
      enabled: true,
      createdAt: '2026-09-10T08:00:00.000Z',
      updatedAt: '2026-09-10T08:00:00.000Z',
      lastRunAt: '2026-09-13T09:01:00.000Z', // Ran today at 09:01
    }

    const nextRun = getNextRunTime(job, fixedNow)
    expect(nextRun).not.toBeNull()
    if (!nextRun) throw new Error('Expected nextRun to be defined')

    // Next run is tomorrow Sep 14 at 09:00
    expect(nextRun).toBeGreaterThan(fixedNow)
    expect(isJobDue(job, [], fixedNow)).toBe(false)
  })

  it('calculates nextRun for hourly job with drift recovery', () => {
    const job: ScheduledJob = {
      id: 'job-hourly',
      name: 'Hourly Job',
      query: 'Sync',
      scheduleType: 'hourly',
      scheduleInterval: 2, // Every 2 hours
      enabled: true,
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
      lastRunAt: '2026-09-13T11:00:00.000Z', // Ran at 11:00, next run was 13:00
    }

    // Now is 14:30 (laptop was closed during 13:00 alarm)
    const nextRun = getNextRunTime(job, fixedNow)
    expect(nextRun).toBe(new Date('2026-09-13T13:00:00.000Z').getTime())
    expect(isJobDue(job, [], fixedNow)).toBe(true)
  })

  it('calculates nextRun for minutes job', () => {
    const job: ScheduledJob = {
      id: 'job-min',
      name: 'Minutes Job',
      query: 'Poll',
      scheduleType: 'minutes',
      scheduleInterval: 15,
      enabled: true,
      createdAt: '2026-09-13T14:00:00.000Z',
      updatedAt: '2026-09-13T14:00:00.000Z',
      lastRunAt: '2026-09-13T14:20:00.000Z', // next was 14:35
    }

    expect(isJobDue(job, [], fixedNow)).toBe(false) // 14:35 > 14:30

    const laterNow = new Date('2026-09-13T14:40:00.000Z').getTime()
    expect(isJobDue(job, [], laterNow)).toBe(true)
  })

  it('suppresses due trigger when a run is already in progress', () => {
    const job: ScheduledJob = {
      id: 'job-running',
      name: 'Running Job',
      query: 'Long task',
      scheduleType: 'minutes',
      scheduleInterval: 5,
      enabled: true,
      createdAt: '2026-09-13T14:00:00.000Z',
      updatedAt: '2026-09-13T14:00:00.000Z',
      lastRunAt: '2026-09-13T14:10:00.000Z',
    }

    const runs: ScheduledJobRun[] = [
      {
        id: 'run-1',
        jobId: 'job-running',
        status: 'running',
        startedAt: '2026-09-13T14:25:00.000Z',
      },
    ]

    expect(isJobDue(job, runs, fixedNow)).toBe(false)
  })

  it('returns false when job is disabled', () => {
    const job: ScheduledJob = {
      id: 'job-disabled',
      name: 'Disabled Job',
      query: 'Sync',
      scheduleType: 'hourly',
      scheduleInterval: 1,
      enabled: false,
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
      lastRunAt: '2026-09-13T11:00:00.000Z',
    }

    expect(isJobDue(job, [], fixedNow)).toBe(false)
    expect(getNextRunTime(job, fixedNow)).toBeNull()
  })
})

describe('scheduledJobRuns - background lifecycle & tab cleanup', () => {
  it('registers chrome.idle.onStateChanged and chrome.runtime.onStartup listeners', async () => {
    const idleListeners: ((state: string) => void)[] = []
    const startupListeners: (() => void)[] = []
    const alarmListeners: ((alarm: { name: string }) => void)[] = []

    const existingChrome = (
      globalThis as unknown as {
        chrome: {
          idle?: {
            onStateChanged: {
              addListener: (fn: (state: string) => void) => void
            }
          }
          runtime: {
            onStartup: { addListener: (fn: () => void) => void }
          }
          alarms: {
            onAlarm: {
              addListener: (fn: (alarm: { name: string }) => void) => void
            }
          }
        }
      }
    ).chrome
    existingChrome.idle = {
      onStateChanged: {
        addListener: (fn: (state: string) => void) => idleListeners.push(fn),
      },
    }
    existingChrome.runtime.onStartup = {
      addListener: (fn: () => void) => startupListeners.push(fn),
    }
    existingChrome.alarms.onAlarm = {
      addListener: (fn: (alarm: { name: string }) => void) =>
        alarmListeners.push(fn),
    }

    await scheduledJobRuns()

    expect(idleListeners.length).toBeGreaterThan(0)
    expect(startupListeners.length).toBeGreaterThan(0)
    expect(alarmListeners.length).toBeGreaterThan(0)

    // Trigger idle listener with 'active' (wake-up event)
    expect(() => {
      idleListeners[0]('active')
    }).not.toThrow()

    // Trigger idle listener with 'idle' / 'locked'
    expect(() => {
      idleListeners[0]('idle')
      idleListeners[0]('locked')
    }).not.toThrow()

    // Trigger startup listener
    expect(() => {
      startupListeners[0]()
    }).not.toThrow()
  })
})
