import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { buildBackgroundTaskNotificationText } from "./background-task-notification-template"
import { initI18n } from "../../shared/i18n"
import { unsafeTestValue } from "../../../../../test-support/unsafe-test-value"

describe("buildBackgroundTaskNotificationText", () => {
  describe("#given one task still running after a completed task notification", () => {
    test("#when building the partial notification #then it does not use the final completed heading", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-1",
          description: "Index repo",
          status: "completed",
        },
        duration: "42s",
        statusText: "COMPLETED",
        allComplete: false,
        remainingCount: 1,
        completedTasks: [],
      })

      // then
      expect(notification).not.toContain("[BACKGROUND TASK COMPLETED]")
      expect(notification).toContain("[BACKGROUND TASK RESULT READY]")
      expect(notification).toContain("You WILL be notified when ALL complete.")
    })

    test("#when building the partial notification #then it preserves the existing completed-task format", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-1",
          description: "Index repo",
          status: "completed",
        },
        duration: "42s",
        statusText: "COMPLETED",
        allComplete: false,
        remainingCount: 1,
        completedTasks: [],
      })

      // when
      const expectedNotification = `<system-reminder>
[BACKGROUND TASK RESULT READY]
**ID:** \`task-1\`
**Description:** Index repo
**Duration:** 42s

**1 task still in progress.** You WILL be notified when ALL complete.
Do NOT poll - continue productive work.

Use \`background_output(task_id="task-1")\` to retrieve this result when ready.
</system-reminder>`

      // then
      expect(notification).toBe(expectedNotification)
    })
  })

  describe("#given one task still running after a failed task notification", () => {
    test("#when building the partial notification #then it preserves the existing failure format", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-2",
          description: "Summarize logs",
          status: "error",
          error: "Timed out",
        },
        duration: "3m 4s",
        statusText: "ERROR",
        allComplete: false,
        remainingCount: 2,
        completedTasks: [],
      })

      // when
      const expectedNotification = `<system-reminder>
[BACKGROUND TASK ERROR]
**ID:** \`task-2\`
**Description:** Summarize logs
**Duration:** 3m 4s
**Error:** Timed out

**2 tasks still in progress.** You WILL be notified when ALL complete.
**ACTION REQUIRED:** This task failed. Check the error and decide whether to retry, cancel remaining tasks, or continue.

Use \`background_output(task_id="task-2")\` to retrieve this result when ready.
</system-reminder>`

      // then
      expect(notification).toBe(expectedNotification)
    })
  })

  describe("#given all sibling tasks completed with mixed outcomes", () => {
    test("#when building the final notification #then it preserves the existing summary format", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-3",
          description: "Fallback task",
          status: "error",
          error: "Denied",
        },
        duration: "10s",
        statusText: "ERROR",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          {
            id: "task-1",
            description: "Index repo",
            status: "completed",
          },
          {
            id: "task-2",
            description: "Summarize logs",
            status: "cancelled",
            error: "User aborted",
          },
          {
            id: "task-3",
            description: "Fallback task",
            status: "error",
            error: "Denied",
          },
        ],
      })

      // when
      const expectedNotification = `<system-reminder>
[ALL BACKGROUND TASKS FINISHED - 2 FAILED]

**Completed:**
- \`task-1\`: Index repo

**Failed:**
- \`task-2\`: Summarize logs [CANCELLED] - User aborted
- \`task-3\`: Fallback task [ERROR] - Denied

Use \`background_output(task_id="<id>")\` to retrieve each result.

**ACTION REQUIRED:** 2 task(s) failed. Check errors above and decide whether to retry or proceed.
</system-reminder>`

      // then
      expect(notification).toBe(expectedNotification)
    })
  })

  describe("#given all tasks completed with undefined descriptions", () => {
    test("#when building the final notification #then it uses task ID as fallback instead of 'undefined'", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "bg_abc123",
          description: unsafeTestValue<string>(undefined),
          status: "completed",
        },
        duration: "5s",
        statusText: "COMPLETED",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          { id: "bg_abc123", description: unsafeTestValue<string>(undefined), status: "completed" },
          { id: "bg_def456", description: unsafeTestValue<string>(undefined), status: "completed" },
        ],
      })

      // then
      expect(notification).not.toContain(": undefined")
      expect(notification).toContain("bg_abc123")
      expect(notification).toContain("bg_def456")
    })
  })

  describe("#given a completed task with retry attempt history", () => {
    test("#when building the final notification #then it includes the final completed heading", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-3",
          description: "Fallback task",
          status: "completed",
        },
        duration: "10s",
        statusText: "COMPLETED",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          {
            id: "task-3",
            description: "Fallback task",
            status: "completed",
          },
        ],
      })

      // then
      expect(notification).toContain("[BACKGROUND TASK COMPLETED]")
      expect(notification).toContain("[ALL BACKGROUND TASKS COMPLETE]")
    })

    test("#when building the final notification #then it renders the spec-aligned balanced attempt timeline", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-3",
          description: "Fallback task",
          status: "completed",
          attempts: [
            {
              attemptId: "att-1",
              attemptNumber: 1,
              sessionId: "ses-primary",
              providerId: "genai-proxy-openai",
              modelId: "gpt-5.4-mini",
              status: "error",
              error: "Forbidden: Selected provider is forbidden",
            },
            {
              attemptId: "att-2",
              attemptNumber: 2,
              sessionId: "ses-fallback",
              providerId: "anthropic",
              modelId: "claude-haiku-4.5",
              status: "completed",
            },
          ],
        },
        duration: "10s",
        statusText: "COMPLETED",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          {
            id: "task-3",
            description: "Fallback task",
            status: "completed",
            attempts: [
              {
                attemptId: "att-1",
                attemptNumber: 1,
                sessionId: "ses-primary",
                providerId: "genai-proxy-openai",
                modelId: "gpt-5.4-mini",
                status: "error",
                error: "Forbidden: Selected provider is forbidden",
              },
              {
                attemptId: "att-2",
                attemptNumber: 2,
                sessionId: "ses-fallback",
                providerId: "anthropic",
                modelId: "claude-haiku-4.5",
                status: "completed",
              },
            ],
          },
        ],
      })

      // then
      expect(notification).toContain("[ALL BACKGROUND TASKS COMPLETE]")
      expect(notification).toContain("- `task-3`: Fallback task")
      expect(notification).toContain("Background task attempts:")
      expect(notification).toContain("  - Attempt 1 — ERROR — genai-proxy-openai/gpt-5.4-mini — ses-primary")
      expect(notification).toContain("    Error: Forbidden: Selected provider is forbidden")
      expect(notification).toContain("  - Attempt 2 — COMPLETED — anthropic/claude-haiku-4.5 — ses-fallback")
    })
  })

  describe("#given a single task notification with undefined description", () => {
    test("#when building the partial notification #then it uses task ID as fallback", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "bg_xyz789",
          description: unsafeTestValue<string>(undefined),
          status: "completed",
        },
        duration: "3s",
        statusText: "COMPLETED",
        allComplete: false,
        remainingCount: 2,
        completedTasks: [],
      })

      // then
      expect(notification).not.toContain("undefined")
      expect(notification).toContain("bg_xyz789")
    })
  })

  describe("#given locale is zh", () => {
    beforeEach(() => {
      initI18n({ locale: "zh", fallback: "en" })
    })

    afterEach(() => {
      initI18n({ locale: "en", fallback: "en" })
    })

    test("#when partial COMPLETED notification #then the result-ready header is localized", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-1",
          description: "索引仓库",
          status: "completed",
        },
        duration: "42s",
        statusText: "COMPLETED",
        allComplete: false,
        remainingCount: 1,
        completedTasks: [],
      })

      // then
      expect(notification).toContain("[后台任务结果已就绪]")
      expect(notification).not.toContain("[BACKGROUND TASK RESULT READY]")
      expect(notification).toContain("**ID:** `task-1`")
    })

    test("#when partial ERROR notification #then the failed header localizes the bracket wrapper but preserves the uppercase status token", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-2",
          description: "汇总日志",
          status: "error",
          error: "超时",
        },
        duration: "3m 4s",
        statusText: "ERROR",
        allComplete: false,
        remainingCount: 2,
        completedTasks: [],
      })

      // then
      expect(notification).toContain("[后台任务 ERROR]")
      expect(notification).not.toContain("[BACKGROUND TASK ERROR]")
      expect(notification).toContain("ERROR")
    })

    test("#when all-complete successful notification #then both header lines localize", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-3",
          description: "回退任务",
          status: "completed",
        },
        duration: "10s",
        statusText: "COMPLETED",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          { id: "task-3", description: "回退任务", status: "completed" },
        ],
      })

      // then
      expect(notification).toContain("[后台任务已完成]")
      expect(notification).toContain("[所有后台任务已全部完成]")
      expect(notification).not.toContain("[BACKGROUND TASK COMPLETED]")
      expect(notification).not.toContain("[ALL BACKGROUND TASKS COMPLETE]")
    })

    test("#when all-complete with failures #then the failure header interpolates the count", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-3",
          description: "回退任务",
          status: "error",
          error: "被拒绝",
        },
        duration: "10s",
        statusText: "ERROR",
        allComplete: true,
        remainingCount: 0,
        completedTasks: [
          { id: "task-1", description: "索引仓库", status: "completed" },
          { id: "task-2", description: "汇总日志", status: "cancelled", error: "用户中止" },
          { id: "task-3", description: "回退任务", status: "error", error: "被拒绝" },
        ],
      })

      // then
      expect(notification).toContain("[所有后台任务已结束 - 2 个失败]")
      expect(notification).not.toContain("[ALL BACKGROUND TASKS FINISHED - 2 FAILED]")
      expect(notification).toContain("**Completed:**")
      expect(notification).toContain("**Failed:**")
    })
  })

  describe("#given locale is en", () => {
    beforeEach(() => {
      initI18n({ locale: "en", fallback: "en" })
    })

    test("#when partial COMPLETED notification #then the English header is preserved (no locale fallback surprises)", () => {
      // given
      const notification = buildBackgroundTaskNotificationText({
        task: {
          id: "task-1",
          description: "Index repo",
          status: "completed",
        },
        duration: "42s",
        statusText: "COMPLETED",
        allComplete: false,
        remainingCount: 1,
        completedTasks: [],
      })

      // then
      expect(notification).toContain("[BACKGROUND TASK RESULT READY]")
      expect(notification).not.toContain("[后台任务")
    })
  })
})
