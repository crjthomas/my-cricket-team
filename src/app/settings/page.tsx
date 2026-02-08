'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Settings,
  User,
  Bell,
  Palette,
  Database,
  Sparkles,
  Shield,
  HelpCircle
} from 'lucide-react'

const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your account and team details',
    icon: User,
    items: [
      { label: 'Team Name', value: 'My Cricket Team', type: 'text' },
      { label: 'Captain', value: 'Raj Kumar', type: 'text' },
      { label: 'Home Ground', value: 'Riverside Ground', type: 'text' },
    ],
  },
  {
    title: 'Notifications',
    description: 'Configure alerts and reminders',
    icon: Bell,
    items: [
      { label: 'Match Reminders', value: true, type: 'toggle' },
      { label: 'Availability Requests', value: true, type: 'toggle' },
      { label: 'Squad Announcements', value: true, type: 'toggle' },
      { label: 'Performance Updates', value: false, type: 'toggle' },
    ],
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel',
    icon: Palette,
    items: [
      { label: 'Theme', value: 'System', type: 'select', options: ['Light', 'Dark', 'System'] },
      { label: 'Accent Color', value: 'Green', type: 'color' },
    ],
  },
  {
    title: 'AI Settings',
    description: 'Configure AI and MCP features',
    icon: Sparkles,
    items: [
      { label: 'AI Squad Suggestions', value: true, type: 'toggle' },
      { label: 'Auto Insights', value: true, type: 'toggle' },
      { label: 'Training Recommendations', value: true, type: 'toggle' },
      { label: 'API Provider', value: 'Anthropic Claude', type: 'text' },
    ],
  },
]

export default function SettingsPage() {
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

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <section.icon className="h-5 w-5" />
              {section.title}
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                </div>
                <div>
                  {item.type === 'toggle' && (
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.value ? 'bg-pitch-600' : 'bg-muted'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  )}
                  {item.type === 'text' && (
                    <span className="text-muted-foreground">{item.value}</span>
                  )}
                  {item.type === 'select' && (
                    <select className="bg-muted rounded-md px-3 py-1 text-sm">
                      {item.options?.map((opt) => (
                        <option key={opt} selected={opt === item.value}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {item.type === 'color' && (
                    <div className="flex gap-2">
                      {['bg-pitch-500', 'bg-blue-500', 'bg-purple-500', 'bg-leather-500', 'bg-stumps-500'].map((color) => (
                        <div 
                          key={color}
                          className={`h-6 w-6 rounded-full ${color} cursor-pointer ring-2 ring-offset-2 ${color === 'bg-pitch-500' ? 'ring-primary' : 'ring-transparent'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

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

