'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Filter,
  Grid,
  List,
  Play,
  Calendar,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock media data
const mediaItems = [
  {
    id: '1',
    type: 'PHOTO',
    title: 'Match Day vs City Lions',
    date: '2026-01-25',
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=300&fit=crop',
    matchId: '6',
    tags: ['Match Day', 'Team Photo'],
  },
  {
    id: '2',
    type: 'VIDEO',
    title: 'Vikram Patel - 4 Wicket Haul',
    date: '2026-01-25',
    thumbnail: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=300&fit=crop',
    duration: 245,
    matchId: '6',
    tags: ['Highlights', 'Bowling'],
  },
  {
    id: '3',
    type: 'PHOTO',
    title: 'Raj Kumar 78* Celebration',
    date: '2026-01-25',
    thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=300&fit=crop',
    tags: ['Celebration', 'Batting'],
  },
  {
    id: '4',
    type: 'PHOTO',
    title: 'Practice Session',
    date: '2026-01-20',
    thumbnail: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=300&fit=crop',
    tags: ['Training', 'Practice'],
  },
  {
    id: '5',
    type: 'VIDEO',
    title: 'Training Drills - Batting',
    date: '2026-01-18',
    thumbnail: 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=400&h=300&fit=crop',
    duration: 420,
    tags: ['Training', 'Batting Drills'],
  },
  {
    id: '6',
    type: 'PHOTO',
    title: 'Team Huddle',
    date: '2026-01-18',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
    tags: ['Team', 'Match Day'],
  },
]

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL')

  const filteredMedia = mediaItems.filter(
    item => filterType === 'ALL' || item.type === filterType
  )

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
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Media
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mediaItems.filter(m => m.type === 'PHOTO').length}</p>
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
              <p className="text-2xl font-bold">{mediaItems.filter(m => m.type === 'VIDEO').length}</p>
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
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Events Covered</p>
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
                src={item.thumbnail}
                alt={item.title}
                className={cn(
                  'w-full object-cover transition-transform duration-300 group-hover:scale-105',
                  viewMode === 'grid' ? 'h-48' : 'h-32'
                )}
              />
              {item.type === 'VIDEO' && (
                <>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/90">
                      <Play className="h-6 w-6 text-midnight-900" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    {formatDuration(item.duration!)}
                  </Badge>
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
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium truncate">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.date}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

