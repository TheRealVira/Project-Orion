import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth';
import { getTeamOwners, addTeamOwner, removeTeamOwner, setTeamOwners, canEditTeam } from '@/lib/utils/team-ownership';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

// GET /api/teams/[id]/owners - Get all owners of a team
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const owners = getTeamOwners(teamId);

    return NextResponse.json({ owners });
  } catch (error) {
    console.error('Get team owners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[id]/owners - Add owner to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    
    // Check if user can edit this team
    if (!canEditTeam(teamId, session.user.id, session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    addTeamOwner(teamId, userId);

    const owners = getTeamOwners(teamId);
    return NextResponse.json({ owners });
  } catch (error: any) {
    console.error('Add team owner error:', error);
    if (error.message === 'User is already an owner of this team') {
      return NextResponse.json({ error: 'User is already an owner' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/owners/[userId] - Remove owner from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user can edit this team
    if (!canEditTeam(teamId, session.user.id, session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    removeTeamOwner(teamId, userId);

    const owners = getTeamOwners(teamId);
    return NextResponse.json({ owners });
  } catch (error: any) {
    console.error('Remove team owner error:', error);
    if (error.message === 'User is not an owner of this team') {
      return NextResponse.json({ error: 'User is not an owner' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/teams/[id]/owners - Replace all owners of a team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    
    // Check if user can edit this team
    if (!canEditTeam(teamId, session.user.id, session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { ownerIds } = body;

    if (!Array.isArray(ownerIds)) {
      return NextResponse.json({ error: 'Owner IDs must be an array' }, { status: 400 });
    }

    setTeamOwners(teamId, ownerIds);

    const owners = getTeamOwners(teamId);
    return NextResponse.json({ owners });
  } catch (error) {
    console.error('Set team owners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
