'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  User, 
  Trash2, 
  Plus, 
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Check,
  Activity,
  Clock,
  UserPlus,
  Edit,
  Calendar,
  Zap,
  Camera,
  MoreVertical
} from 'lucide-react'

interface UserData {
  id: string
  username: string
  role: 'ADMIN' | 'MEDIA_MANAGER' | 'USER'
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  activeSessions: number
}

interface ActivityData {
  id: string
  type: string
  title: string
  description: string | null
  actorName: string | null
  entityType: string | null
  createdAt: string
}

export default function UserManagementPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users')
  
  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'ADMIN' | 'MEDIA_MANAGER' | 'USER'>('USER')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setActivities(data.activities || [])
      } else {
        setError('Failed to load users')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PLAYER_ADDED': return <UserPlus className="h-4 w-4 text-green-500" />
      case 'PLAYER_UPDATED': return <Edit className="h-4 w-4 text-blue-500" />
      case 'MATCH_CREATED': 
      case 'MATCH_UPDATED': return <Calendar className="h-4 w-4 text-purple-500" />
      case 'SQUAD_SELECTED': return <Zap className="h-4 w-4 text-amber-500" />
      case 'RATING_UPDATED': return <Activity className="h-4 w-4 text-orange-500" />
      case 'USER_LOGIN': return <User className="h-4 w-4 text-green-500" />
      case 'USER_CREATED': return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'USER_ROLE_CHANGED': return <Shield className="h-4 w-4 text-amber-500" />
      case 'MEDIA_UPLOADED': return <Activity className="h-4 w-4 text-pink-500" />
      case 'SEASON_STARTED': return <Calendar className="h-4 w-4 text-green-500" />
      case 'AI_RECOMMENDATION': return <Zap className="h-4 w-4 text-purple-500" />
      case 'AVAILABILITY_UPDATED': return <Edit className="h-4 w-4 text-cyan-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`User "${newUsername}" created successfully`)
        setNewUsername('')
        setNewPassword('')
        setNewRole('USER')
        setShowNewUserForm(false)
        fetchUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsCreating(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'MEDIA_MANAGER' | 'USER') => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        setSuccess('User role updated')
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update role')
      }
    } catch {
      setError('Network error')
    }
  }

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/auth/users?id=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess(`User "${username}" deleted`)
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete user')
      }
    } catch {
      setError('Network error')
    }
  }

  if (!isAdmin) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage team members and view app activity</p>
        </div>
        <Button onClick={() => setShowNewUserForm(!showNewUserForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'users' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users ({users.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'activity' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log ({activities.length})
          </div>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      {activeTab === 'users' && (
        <>
      {/* New User Form */}
      {showNewUserForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new team member with custom access level</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="username"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'MEDIA_MANAGER' | 'USER')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="USER">Viewer (View Only)</option>
                    <option value="MEDIA_MANAGER">Media Manager (Media & Stats)</option>
                    <option value="ADMIN">Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    u.role === 'ADMIN' 
                      ? 'bg-amber-100 text-amber-600' 
                      : u.role === 'MEDIA_MANAGER'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {u.role === 'ADMIN' ? (
                      <Shield className="h-5 w-5" />
                    ) : u.role === 'MEDIA_MANAGER' ? (
                      <Camera className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.username}</span>
                      {u.id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                      {u.activeSessions > 0 && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                          {u.activeSessions} active session{u.activeSessions > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {u.lastLoginAt 
                          ? `Last login: ${formatTimeAgo(u.lastLoginAt)}`
                          : 'Never logged in'
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined: {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge 
                    variant={u.role === 'ADMIN' ? 'default' : 'secondary'}
                    className={u.role === 'MEDIA_MANAGER' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                  >
                    {u.role === 'ADMIN' ? 'Admin' : u.role === 'MEDIA_MANAGER' ? 'Media Manager' : 'Viewer'}
                  </Badge>

                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as 'ADMIN' | 'MEDIA_MANAGER' | 'USER')}
                        className="text-sm px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        title="Change role"
                      >
                        <option value="USER">Viewer</option>
                        <option value="MEDIA_MANAGER">Media Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteUser(u.id, u.username)}
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">Admin</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>Full access to all features</li>
                <li>AI Squad Selector</li>
                <li>Add/Edit players, matches, venues</li>
                <li>Manage team settings</li>
                <li>Create and manage users</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Media Manager</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>All Viewer permissions</li>
                <li>Manage media gallery</li>
                <li>Add press releases</li>
                <li>Record match statistics</li>
                <li>Update player performance</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">Viewer</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>View team dashboard</li>
                <li>View player profiles and stats</li>
                <li>View match schedules and results</li>
                <li>View media gallery</li>
                <li>No editing features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Track all actions performed in the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No activity recorded yet</p>
                <p className="text-sm">Actions like adding players, creating matches, and selecting squads will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{activity.title}</span>
                        {activity.entityType && (
                          <Badge variant="outline" className="text-xs">
                            {activity.entityType}
                          </Badge>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {activity.actorName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.actorName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
