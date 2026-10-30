import { getAgentServerUrl } from '@/lib/browseros/helpers'
import { onScheduleMessage } from '@/lib/messaging/schedules/scheduleMessages'
import { createAlarmFromJob } from '@/lib/schedules/createAlarmFromJob'
import { getChatServerResponse } from '@/lib/schedules/getChatServerResponse'
import type {
  ScheduledJob,
  ScheduledJobRun,
} from '@/lib/schedules/scheduleTypes'
import {
  listScheduledJobRunsOrNull,
  listScheduledJobsOrNull,
  putScheduledJob,
  putScheduledJobRun,
} from '@/modules/schedules/schedules.api'
import { applyLastRunAt } from '@/modules/schedules/schedules.helpers'

const STALE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

const runAbortControllers = new Map<string, AbortController>()

/**
 * Calculates the next epoch timestamp (in ms) when a job is scheduled to run.
 * Handles daily, hourly, and minute intervals with proper drift/sleep awareness.
 */
export const getNextRunTime = (
  job: ScheduledJob,
  now: number = Date.now(),
): number | null => {
  if (!job.enabled) return null

  if (job.scheduleType === 'daily') {
    if (!job.scheduleTime) return null
    const [hours, minutes] = job.scheduleTime.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

    if (job.lastRunAt) {
      const lastRun = new Date(job.lastRunAt)
      const next = new Date(lastRun)
      next.setHours(hours, minutes, 0, 0)
      if (next.getTime() <= lastRun.getTime()) {
        next.setDate(next.getDate() + 1)
      }
      return next.getTime()
    }

    // If the job has never run, base schedule off creation time
    const created = new Date(job.createdAt).getTime()
    const scheduledToday = new Date(now)
    scheduledToday.setHours(hours, minutes, 0, 0)
    // If created today after the scheduled hour, next run is tomorrow
    if (created > scheduledToday.getTime()) {
      scheduledToday.setDate(scheduledToday.getDate() + 1)
    }
    return scheduledToday.getTime()
  }

  if (job.scheduleType === 'hourly') {
    const intervalHours = job.scheduleInterval ?? 1
    const intervalMs = intervalHours * 60 * 60 * 1000
    const baseTime = job.lastRunAt
      ? new Date(job.lastRunAt).getTime()
      : new Date(job.createdAt).getTime()
    return baseTime + intervalMs
  }

  if (job.scheduleType === 'minutes') {
    const intervalMinutes = job.scheduleInterval ?? 1
    const intervalMs = intervalMinutes * 60 * 1000
    const baseTime = job.lastRunAt
      ? new Date(job.lastRunAt).getTime()
      : new Date(job.createdAt).getTime()
    return baseTime + intervalMs
  }

  return null
}

/**
 * Verifies whether a scheduled job is due or missed (e.g. system was asleep during alarm).
 */
export const isJobDue = (
  job: ScheduledJob,
  runs: ScheduledJobRun[] = [],
  now: number = Date.now(),
): boolean => {
  if (!job.enabled) return false

  const hasRunningRun = runs.some(
    (r) => r.jobId === job.id && r.status === 'running',
  )
  if (hasRunningRun) return false

  const nextRun = getNextRunTime(job, now)
  if (nextRun === null) return false

  return nextRun <= now
}

export const scheduledJobRuns = async () => {
  // Every read below distinguishes an unreachable server from an empty list.
  // Treating the two alike would look like "nothing is scheduled": alarms would
  // not be rebuilt on startup and schedules would quietly stop firing, with no
  // failed run to show for it. Skipping the pass instead leaves the next
  // startup to retry.
  const cleanupStaleJobRuns = async () => {
    const current = await listScheduledJobRunsOrNull()
    if (current === null) return
    const now = Date.now()

    const stale = current.filter(
      (run) =>
        run.status === 'running' &&
        now - new Date(run.startedAt).getTime() > STALE_TIMEOUT_MS,
    )

    for (const run of stale) {
      await putScheduledJobRun({
        ...run,
        status: 'failed',
        completedAt: new Date().toISOString(),
        result: 'Job timed out!',
      })
    }
  }

  const syncAlarmState = async () => {
    const loaded = await listScheduledJobsOrNull()
    if (loaded === null) return
    const enabledJobs = loaded.filter((each) => each.enabled)
    const enabledJobIds = new Set(enabledJobs.map((j) => j.id))

    for (let i = 0; i < enabledJobs.length; i++) {
      const job = enabledJobs[i]
      const alarmName = `scheduled-job-${job.id}`
      const existingAlarm = await chrome.alarms?.get?.(alarmName)

      if (!existingAlarm) {
        await createAlarmFromJob(job)
      }
    }

    try {
      const existingAlarms = (await chrome.alarms?.getAll?.()) ?? []
      for (const alarm of existingAlarms) {
        if (alarm.name.startsWith('scheduled-job-')) {
          const id = alarm.name.replace('scheduled-job-', '')
          if (!enabledJobIds.has(id)) {
            await chrome.alarms?.clear?.(alarm.name)
          }
        }
      }
    } catch {
      // Non-blocking alarm inspection failure
    }
  }

  const createJobRun = async (
    jobId: string,
    status: ScheduledJobRun['status'],
  ): Promise<ScheduledJobRun> => {
    // Trimming to the per-job cap happens on the server now, so creating a run
    // no longer has to rewrite the job's whole history to stay bounded.
    const jobRun: ScheduledJobRun = {
      id: crypto.randomUUID(),
      jobId,
      startedAt: new Date().toISOString(),
      status,
    }

    await putScheduledJobRun(jobRun)
    return jobRun
  }

  // Takes the run rather than its id: the caller already holds it, and merging
  // locally avoids re-reading a list to update one row.
  const updateJobRun = async (
    run: ScheduledJobRun,
    updates: Partial<Omit<ScheduledJobRun, 'id' | 'jobId' | 'startedAt'>>,
  ) => {
    await putScheduledJobRun({ ...run, ...updates })
  }

  // Takes an id, not the job: a snapshot captured before the run would be
  // minutes stale by the time this writes, and putting it back would revert any
  // edit made while the run was going.
  const updateJobLastRunAt = async (jobId: string) => {
    const jobs = await listScheduledJobsOrNull()
    if (jobs === null) return

    const updated = applyLastRunAt(jobs, jobId, new Date().toISOString())
    if (updated) await putScheduledJob(updated)
  }

  const executeScheduledJob = async (jobId: string): Promise<void> => {
    const jobs = await listScheduledJobsOrNull()
    if (jobs === null) {
      throw new Error('Cannot reach the BrowserOS server to load the job')
    }

    const job = jobs.find((each) => each.id === jobId)
    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }

    const jobRun = await createJobRun(jobId, 'running')
    const abortController = new AbortController()
    runAbortControllers.set(jobRun.id, abortController)
    const conversationId = crypto.randomUUID()

    // Chrome MV3 Keep-Alive: Ping platform info every 20s to prevent Chrome from
    // prematurely suspending the service worker while the agent executes in background.
    const keepAliveInterval = setInterval(() => {
      chrome.runtime?.getPlatformInfo?.().catch(() => {})
    }, 20000)

    // Track any background tab created during this scheduled execution so it can be cleaned up
    let scheduledTabId: number | undefined
    const onTabCreated = (tab: chrome.tabs.Tab) => {
      if (tab.id !== undefined && !tab.active) {
        scheduledTabId = tab.id
      }
    }
    chrome.tabs?.onCreated?.addListener?.(onTabCreated)

    try {
      const response = await getChatServerResponse({
        message: job.query,
        signal: abortController.signal,
        providerId: job.providerId,
        conversationId,
      })

      await updateJobRun(jobRun, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: response.text,
        finalResult: response.finalResult,
        executionLog: response.executionLog,
        toolCalls: response.toolCalls,
      })
    } catch (e) {
      const isCancelled = abortController.signal.aborted
      const errorMessage = isCancelled
        ? 'Cancelled by user'
        : e instanceof Error
          ? e.message
          : String(e)
      await updateJobRun(jobRun, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        result: errorMessage,
        error: errorMessage,
      })
    } finally {
      clearInterval(keepAliveInterval)
      runAbortControllers.delete(jobRun.id)
      chrome.tabs?.onCreated?.removeListener?.(onTabCreated)

      // Scheduled Task Background Tab Cleanup: explicitly close background tab
      if (scheduledTabId !== undefined) {
        try {
          await chrome.tabs.remove(scheduledTabId)
        } catch {
          // Tab may already have been closed by server session teardown
        }
      }

      // Explicitly delete the session on server to close session.scheduledPageId and revoke tool leases
      try {
        const agentServerUrl = await getAgentServerUrl()
        await fetch(`${agentServerUrl}/chat/${conversationId}`, {
          method: 'DELETE',
        }).catch(() => {})
      } catch {
        // Non-blocking cleanup
      }

      await updateJobLastRunAt(jobId)
    }
  }

  let runningMissedJobs = false

  const runMissedJobs = async () => {
    if (runningMissedJobs) return
    runningMissedJobs = true

    try {
      const loadedJobs = await listScheduledJobsOrNull()
      const runs = await listScheduledJobRunsOrNull()
      if (loadedJobs === null || runs === null) return

      const jobs = loadedJobs.filter((j) => j.enabled)
      const now = Date.now()

      for (const job of jobs) {
        let isDue = isJobDue(job, runs, now)
        if (!isDue) {
          try {
            const alarm = await chrome.alarms?.get?.(`scheduled-job-${job.id}`)
            if (alarm && alarm.scheduledTime <= now) {
              isDue = true
            }
          } catch {
            // Non-blocking alarm inspection
          }
        }

        if (isDue) {
          try {
            await executeScheduledJob(job.id)
          } catch {
            // Handled and recorded in updateJobRun
          }
        }
      }
    } finally {
      runningMissedJobs = false
    }
  }

  chrome.alarms?.onAlarm?.addListener?.(async (alarm) => {
    if (!alarm.name.startsWith('scheduled-job-')) return
    const jobId = alarm.name.replace('scheduled-job-', '')
    // Re-verify alarms state upon wake-up to keep schedules healthy
    void syncAlarmState().catch(() => {})
    await executeScheduledJob(jobId)
  })

  onScheduleMessage('runScheduledJob', async ({ data }) => {
    try {
      await executeScheduledJob(data.jobId)
      return { success: true }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  })

  onScheduleMessage('cancelScheduledJobRun', async ({ data }) => {
    const controller = runAbortControllers.get(data.runId)
    if (!controller) {
      return { success: false, error: 'Run not found or already completed' }
    }
    controller.abort()
    return { success: true }
  })

  // Synchronize alarms and catch up missed jobs immediately whenever the
  // background service worker wakes up or initializes in Chrome MV3.
  const initializeSchedules = async () => {
    await cleanupStaleJobRuns()
    await syncAlarmState()
    await runMissedJobs()
  }

  void initializeSchedules().catch(() => {})

  chrome.runtime?.onStartup?.addListener?.(initializeSchedules)
  chrome.runtime?.onInstalled?.addListener?.(initializeSchedules)

  // Alarms Drift Recovery: If the system sleeps (laptop lid closed) during an alarm time,
  // Chrome skips the missed trigger. On wake-up, verify if any scheduled job's nextRun
  // is in the past and trigger it immediately.
  chrome.idle?.onStateChanged?.addListener?.(async (newState) => {
    if (newState === 'active') {
      await initializeSchedules().catch(() => {})
    }
  })
}
