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
  Check
} from 'lucide-react'

interface UserData {
  id: string
  username: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function UserManagementPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER'>('USER')
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
      } else {
        setError('Failed to load users')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
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

  const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'USER') => {
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
          <p className="text-gray-500">Manage team members and their access levels</p>
        </div>
        <Button onClick={() => setShowNewUserForm(!showNewUserForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
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
                    onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'USER')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="USER">Viewer (View Only)</option>
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
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {u.role === 'ADMIN' ? (
                      <Shield className="h-5 w-5" />
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
                    </div>
                    <div className="text-sm text-gray-500">
                      {u.lastLoginAt 
                        ? `Last login: ${new Date(u.lastLoginAt).toLocaleDateString()}`
                        : 'Never logged in'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                  </Badge>

                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      {u.role === 'USER' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateUserRole(u.id, 'ADMIN')}
                          title="Promote to Admin"
                        >
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateUserRole(u.id, 'USER')}
                          title="Demote to Viewer"
                        >
                          <ArrowDown className="h-4 w-4 text-orange-600" />
                        </Button>
                      )}
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
          <div className="grid md:grid-cols-2 gap-6">
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
                <User className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">Viewer</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>View team dashboard</li>
                <li>View player profiles and stats</li>
                <li>View match schedules and results</li>
                <li>View media gallery</li>
                <li>No editing or admin features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
