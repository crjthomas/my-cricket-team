'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/lib/auth-context'
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Grid,
  List,
  Play,
  Calendar,
  Users,
  Loader2,
  Trash2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  type: 'PHOTO' | 'VIDEO'
  url: string
  thumbnailUrl?: string
  title?: string
  description?: string
  duration?: number
  createdAt: string
  match?: {
    id: string
    matchNumber: number
    opponent: { name: string }
  }
  tags: { tag: string }[]
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function MediaPage() {
  const { canManageMedia } = usePermissions()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState<'PHOTO' | 'VIDEO'>('PHOTO')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              media {
                id type url thumbnailUrl title description duration createdAt
                match { id matchNumber opponent { name } }
                tags { tag }
              }
            }
          `,
        }),
      })
      const { data } = await res.json()
      setMedia(data?.media || [])
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadUrl.trim()) return
    
    setSaving(true)
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateMedia($input: MediaInput!) {
              createMedia(input: $input) { id }
            }
          `,
          variables: {
            input: {
              type: uploadType,
              url: uploadUrl,
              title: uploadTitle || undefined,
            },
          },
        }),
      })
      setShowUploadModal(false)
      setUploadUrl('')
      setUploadTitle('')
      fetchMedia()
    } catch (error) {
      console.error('Failed to upload media:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteMedia($id: ID!) { deleteMedia(id: $id) }`,
          variables: { id },
        }),
      })
      fetchMedia()
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  const filteredMedia = media.filter(
    item => filterType === 'ALL' || item.type === filterType
  )

  const photoCount = media.filter(m => m.type === 'PHOTO').length
  const videoCount = media.filter(m => m.type === 'VIDEO').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Photos and videos from matches and training sessions
          </p>
        </div>
        {canManageMedia && (
          <Button className="gap-2" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4" />
            Add Media
          </Button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowUploadModal(false)} />
          <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-md bg-background border rounded-lg shadow-lg z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Media</h2>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={uploadType === 'PHOTO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadType('PHOTO')}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" /> Photo
                  </Button>
                  <Button
                    variant={uploadType === 'VIDEO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadType('VIDEO')}
                    className="gap-2"
                  >
                    <Video className="h-4 w-4" /> Video
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL *</label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="Match Day Photo"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={saving || !uploadUrl.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Media
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{photoCount}</p>
              <p className="text-sm text-muted-foreground">Photos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-leather-100 dark:bg-leather-900">
              <Video className="h-5 w-5 text-leather-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{videoCount}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Calendar className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{media.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['ALL', 'PHOTO', 'VIDEO'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="gap-2"
                >
                  {type === 'PHOTO' && <ImageIcon className="h-4 w-4" />}
                  {type === 'VIDEO' && <Video className="h-4 w-4" />}
                  {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Media Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload photos and videos from matches and training sessions
            </p>
            {canManageMedia && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Media
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' 
            : 'space-y-4'
        )}>
          {filteredMedia.map((item, index) => (
            <Card 
              key={item.id} 
              glow
              className={cn(
                'overflow-hidden cursor-pointer group',
                `stagger-${(index % 5) + 1} animate-slide-up`
              )}
            >
              <div className="relative">
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title || 'Media'}
                  className={cn(
                    'w-full object-cover transition-transform duration-300 group-hover:scale-105',
                    viewMode === 'grid' ? 'h-48' : 'h-32'
                  )}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/400x300?text=Media'
                  }}
                />
                {item.type === 'VIDEO' && (
                  <>
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-3 rounded-full bg-white/90">
                        <Play className="h-6 w-6 text-midnight-900" />
                      </div>
                    </div>
                    {item.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                        {formatDuration(item.duration)}
                      </Badge>
                    )}
                  </>
                )}
                <Badge 
                  className={cn(
                    'absolute top-2 left-2',
                    item.type === 'PHOTO' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-leather-500 text-white'
                  )}
                >
                  {item.type === 'PHOTO' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                </Badge>
                {canManageMedia && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{item.title || 'Untitled'}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((t) => (
                      <Badge key={t.tag} variant="outline" className="text-xs">
                        {t.tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Caption Feature Teaser */}
      <Card className="border-pitch-200 dark:border-pitch-800 bg-gradient-to-r from-pitch-50 to-transparent dark:from-pitch-950/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pitch-100 dark:bg-pitch-900">
              <Users className="h-6 w-6 text-pitch-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">AI-Powered Features Coming Soon</h3>
              <p className="text-muted-foreground">
                Auto-tag players in photos, generate highlight reels, and create AI captions for your media.
              </p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
