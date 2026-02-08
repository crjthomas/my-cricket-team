import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏏 Setting up Phoenix Cricket database...')

  // Clean up all existing data
  console.log('🧹 Cleaning up existing data...')
  
  await prisma.mediaTag.deleteMany({})
  await prisma.media.deleteMany({})
  await prisma.matchPerformance.deleteMany({})
  await prisma.squadPlayer.deleteMany({})
  await prisma.squad.deleteMany({})
  await prisma.playerAvailability.deleteMany({})
  await prisma.match.deleteMany({})
  await prisma.seasonStats.deleteMany({})
  await prisma.season.deleteMany({})
  await prisma.opponent.deleteMany({})
  await prisma.venue.deleteMany({})
  await prisma.player.deleteMany({})
  await prisma.aiInteraction.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.teamSettings.deleteMany({})

  console.log('✅ All existing data cleaned')

  // Create default admin user
  // Password: admin123 (user should change this immediately)
  const adminPasswordHash = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  console.log('✅ Created admin user (username: admin, password: admin123)')
  console.log('   ⚠️  Please change the admin password after first login!')

  // Create a sample viewer user for testing
  const viewerPasswordHash = await bcrypt.hash('viewer123', 12)
  
  await prisma.user.create({
    data: {
      username: 'viewer',
      passwordHash: viewerPasswordHash,
      role: UserRole.USER,
      isActive: true,
    },
  })

  console.log('✅ Created viewer user (username: viewer, password: viewer123)')

  // Create default team settings
  await prisma.teamSettings.create({
    data: {
      id: 'default',
      teamName: 'Phoenix Cricket',
      captainName: null,
      homeGround: null,
    },
  })

  console.log('✅ Created default team settings')

  // Create initial activity
  await prisma.activity.create({
    data: {
      type: 'SEASON_STARTED',
      title: 'Phoenix Cricket Team Setup',
      description: 'Team management system initialized. Ready to add players and schedule matches.',
    },
  })

  console.log('')
  console.log('🏏 Phoenix Cricket database setup complete!')
  console.log('')
  console.log('📝 Next steps:')
  console.log('   1. Login as admin and change your password')
  console.log('   2. Add your team players')
  console.log('   3. Create a new season')
  console.log('   4. Add opponents and venues')
  console.log('   5. Schedule matches')
  console.log('')
}

main()
  .catch((e) => {
    console.error('Error setting up database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
