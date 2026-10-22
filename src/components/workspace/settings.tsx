import { useState } from 'react'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from '../ui/card'
import { Field, PageTitle, Select, useWorkspace } from '../workspace'
import { settingsSchema } from '@/lib/inputs'
import { downloadData } from '@/lib/app-api'

export function SettingsPage() {
  const { data, run, disabled } = useWorkspace()
  const [settings, setSettings] = useState(() =>
    settingsSchema.parse(data.member),
  )
  const [confirmation, setConfirmation] = useState(''),
    [error, setError] = useState(''),
    [exporting, setExporting] = useState(false)
  async function exportFile(format: 'csv' | 'json') {
    setError('')
    setExporting(true)
    try {
      const text = await downloadData({ data: format })
      const url = URL.createObjectURL(
        new Blob([text], {
          type:
            format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json',
        }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `tally-${new Date().toISOString().slice(0, 10)}.${format}`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError('Export failed. Check your connection and retry.')
    } finally {
      setExporting(false)
    }
  }
  const textFields = [
    ['displayName', 'Display name', 60],
    ['country', 'Country', 60],
    ['primaryFocus', 'Primary focus', 100],
    ['timeZone', 'Time zone (IANA name)', 100],
  ] as const
  const numbers = [
    ['focusMinutes', 'Focus minutes', 1, 1440],
    ['breakMinutes', 'Break minutes', 1, 1440],
    ['rounds', 'Rounds', 1, 100],
    ['dailyGoalMinutes', 'Daily goal minutes (0 for unset)', 0, 1440],
    ['weeklyGoalMinutes', 'Weekly goal minutes (0 for unset)', 0, 10080],
  ] as const
  return (
    <>
      <PageTitle
        title="Your workspace, your rules."
        detail="Profile fields are visible to approved members. Statistics and challenge results each have separate sharing controls."
      />
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          const result = settingsSchema.safeParse(settings)
          if (!result.success) {
            setError(z.prettifyError(result.error))
            return
          }
          await run({ action: 'settings', ...result.data })
        }}
      >
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="font-semibold">Profile and calendar</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {textFields.map(([key, label, maxLength]) => (
                <Field key={key} label={label}>
                  <Input
                    value={settings[key]}
                    required={key === 'displayName' || key === 'timeZone'}
                    maxLength={maxLength}
                    onChange={(e) =>
                      setSettings({ ...settings, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Bio">
              <Textarea
                value={settings.bio}
                maxLength={1000}
                onChange={(e) =>
                  setSettings({ ...settings, bio: e.target.value })
                }
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Changing your personal time zone recalculates personal calendar
              reports. The group calendar stays fixed.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="font-semibold">Focus and appearance</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {numbers.map(([key, label, min, max]) => (
                <Field key={key} label={label}>
                  <Input
                    type="number"
                    value={settings[key]}
                    min={min}
                    max={max}
                    required
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [key]: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              ))}
              <Field label="Theme">
                <Select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      theme: settingsSchema.shape.theme.parse(e.target.value),
                    })
                  }
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) =>
                  setSettings({ ...settings, sound: e.target.checked })
                }
              />
              Play a sound when a countdown ends
            </label>
            <p className="text-xs text-muted-foreground">
              Browser sleep and sound permissions may delay or suppress the
              sound; the server still finalizes the phase at its deadline.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="font-semibold">Statistics sharing</h2>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1"
                type="checkbox"
                checked={settings.leaderboardOptIn}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    leaderboardOptIn: e.target.checked,
                  })
                }
              />
              <span>
                Show my aggregate eligible time and streak statistics on group
                leaderboards and my profile.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              Turning this off hides historical statistics too. Challenge
              results are shared separately on the Challenges page.
            </p>
          </CardContent>
        </Card>
        {error && (
          <p
            role="alert"
            className="whitespace-pre-wrap text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Button>Save settings</Button>
      </form>
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Export your data</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          CSV contains your session records. JSON includes your owned planning,
          focus history, settings, and challenge records. Authentication
          credentials are excluded.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={disabled || exporting}
            onClick={() => void exportFile('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            disabled={disabled || exporting}
            onClick={() => void exportFile('json')}
          >
            Export JSON
          </Button>
        </div>
      </section>
      <section className="mt-12 rounded-xl border border-destructive/30 p-6">
        <h2 className="mb-4 text-lg font-semibold">Data controls</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Focus reset permanently removes your sessions, timing history, custom
          challenges, enrollments, and derived badges. Tasks, tags, settings,
          goals, profile, and friendships stay. Account deletion removes your
          account and all owned data and social relationships. Export first if
          you need a copy.
        </p>
        <Field label="Type RESET FOCUS or DELETE ACCOUNT to confirm">
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="destructive"
            disabled={disabled || confirmation !== 'RESET FOCUS'}
            onClick={async () => {
              if (await run({ action: 'reset', confirmation }))
                setConfirmation('')
            }}
          >
            Reset focus data
          </Button>
          <Button
            variant="destructive"
            disabled={disabled || confirmation !== 'DELETE ACCOUNT'}
            onClick={async () => {
              if (await run({ action: 'delete-account', confirmation }))
                window.location.assign('/')
            }}
          >
            Delete account
          </Button>
        </div>
      </section>
    </>
  )
}
