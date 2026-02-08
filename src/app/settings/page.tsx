'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { 
  Settings,
  User,
  Bell,
  Palette,
  Database,
  Sparkles,
  Shield,
  HelpCircle,
  Users,
  Lock,
  ChevronRight,
  Save,
  Loader2
} from 'lucide-react'

import { useState, useEffect } from 'react'

interface TeamSettings {
  teamName: string
  captainName: string | null
  homeGround: string | null
  matchReminders: boolean
  availabilityRequests: boolean
  squadAnnouncements: boolean
  performanceUpdates: boolean
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">{success}</div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
          minLength={6}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Changing...' : 'Change Password'}
      </Button>
    </form>
  )
}

function TeamProfileForm({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<TeamSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/team-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch {
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/team-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSuccess('Settings saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Loading settings...</div>
  }

  if (!settings) {
    return <div className="text-red-500">Failed to load settings</div>
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">{success}</div>}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <label className="font-medium">Team Name</label>
          {isAdmin ? (
            <input
              type="text"
              value={settings.teamName}
              onChange={(e) => setSettings({ ...settings, teamName: e.target.value })}
              className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-right"
            />
          ) : (
            <span className="text-muted-foreground">{settings.teamName}</span>
          )}
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <label className="font-medium">Captain</label>
          {isAdmin ? (
            <input
              type="text"
              value={settings.captainName || ''}
              onChange={(e) => setSettings({ ...settings, captainName: e.target.value })}
              className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-right"
              placeholder="Enter captain name"
            />
          ) : (
            <span className="text-muted-foreground">{settings.captainName || 'Not set'}</span>
          )}
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <label className="font-medium">Home Ground</label>
          {isAdmin ? (
            <input
              type="text"
              value={settings.homeGround || ''}
              onChange={(e) => setSettings({ ...settings, homeGround: e.target.value })}
              className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-right"
              placeholder="Enter home ground"
            />
          ) : (
            <span className="text-muted-foreground">{settings.homeGround || 'Not set'}</span>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

function NotificationSettings({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<TeamSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/team-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (field: keyof TeamSettings) => {
    if (!settings || !isAdmin) return
    
    const newSettings = { ...settings, [field]: !settings[field] }
    setSettings(newSettings)
    setIsSaving(true)

    try {
      await fetch('/api/team-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newSettings[field] }),
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  const toggleItems = [
    { key: 'matchReminders' as const, label: 'Match Reminders' },
    { key: 'availabilityRequests' as const, label: 'Availability Requests' },
    { key: 'squadAnnouncements' as const, label: 'Squad Announcements' },
    { key: 'performanceUpdates' as const, label: 'Performance Updates' },
  ]

  return (
    <div className="space-y-4">
      {toggleItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
          <p className="font-medium">{item.label}</p>
          <button
            onClick={() => handleToggle(item.key)}
            disabled={!isAdmin || isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings[item.key] ? 'bg-pitch-600' : 'bg-muted'
            } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings[item.key] ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { isAdmin, user } = useAuth()

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your team settings and preferences
        </p>
      </div>

      {/* User Management - Admin Only */}
      {isAdmin && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              User Management
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">Admin</Badge>
            </CardTitle>
            <CardDescription>Manage team members and their access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/settings/users')}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Manage Users
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Team Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Manage your team details</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamProfileForm isAdmin={isAdmin} />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings isAdmin={isAdmin} />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <p className="font-medium">Theme</p>
            <select className="bg-muted rounded-md px-3 py-1 text-sm" defaultValue="System">
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
              <option value="System">System</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="font-medium">Accent Color</p>
            <div className="flex gap-2">
              {['bg-pitch-500', 'bg-blue-500', 'bg-purple-500', 'bg-leather-500', 'bg-stumps-500'].map((color) => (
                <div 
                  key={color}
                  className={`h-6 w-6 rounded-full ${color} cursor-pointer ring-2 ring-offset-2 ${color === 'bg-pitch-500' ? 'ring-primary' : 'ring-transparent'}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Settings
          </CardTitle>
          <CardDescription>Configure AI and MCP features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <p className="font-medium">AI Squad Suggestions</p>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-pitch-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <p className="font-medium">Auto Insights</p>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-pitch-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <p className="font-medium">Training Recommendations</p>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-pitch-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="font-medium">API Provider</p>
            <span className="text-muted-foreground">Anthropic Claude</span>
          </div>
        </CardContent>
      </Card>

      {/* Database & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, or backup your team data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Export to CSV</Button>
            <Button variant="outline">Export to JSON</Button>
            <Button variant="outline">Create Backup</Button>
            <Button variant="outline">Import Data</Button>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>Last backup: Never</p>
            <p>Database: PostgreSQL (Local)</p>
          </div>
        </CardContent>
      </Card>

      {/* MCP Server Info */}
      <Card className="border-pitch-200 dark:border-pitch-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pitch-500" />
            MCP Server
          </CardTitle>
          <CardDescription>Model Context Protocol integration for AI assistants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">cricket-team-mcp</p>
              <p className="text-sm text-muted-foreground">v1.0.0 • stdio transport</p>
            </div>
            <Badge variant="success">Available</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Available tools:</p>
            <ul className="space-y-1 ml-4">
              <li>• get_players - Query player data</li>
              <li>• suggest_squad - AI squad recommendations</li>
              <li>• get_opportunity_debt - Fair play tracking</li>
              <li>• get_training_plan - Personalized training</li>
              <li>• analyze_match - Match insights</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">View Documentation</Button>
            <Button variant="outline" size="sm">Test Connection</Button>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Documentation</p>
                <p className="text-sm text-muted-foreground">Learn how to use all features</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Report an Issue</p>
                <p className="text-sm text-muted-foreground">Found a bug? Let us know</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Feature Request</p>
                <p className="text-sm text-muted-foreground">Suggest new features</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Contact Support</p>
                <p className="text-sm text-muted-foreground">Get help from the team</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>My Cricket Team v1.0.0</p>
        <p>Built with Next.js, Prisma, GraphQL, and Claude AI</p>
      </div>
    </div>
  )
}

