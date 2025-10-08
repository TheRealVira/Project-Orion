import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// GET /api/team-owners - Get all team ownership mappings
export async function GET() {
  try {
    const db = getDatabase();
    
    // Get all team ownership records
    const ownerships = db.prepare(`
      SELECT teamId, userId
      FROM team_owners
    `).all() as { teamId: string; userId: string }[];
    
    // Group by teamId
    const ownershipMap: Record<string, string[]> = {};
    
    for (const ownership of ownerships) {
      if (!ownershipMap[ownership.teamId]) {
        ownershipMap[ownership.teamId] = [];
      }
      ownershipMap[ownership.teamId].push(ownership.userId);
    }
    
    return NextResponse.json(ownershipMap);
  } catch (error) {
    console.error('Error fetching team owners:', error);
    return NextResponse.json({ error: 'Failed to fetch team owners' }, { status: 500 });
  }
}
