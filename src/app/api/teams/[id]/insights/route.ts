import { NextRequest, NextResponse } from 'next/server';
import { insightService } from '@/lib/services/insightService';

// Force dynamic rendering - this route needs runtime database access
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: teamId } = params;

    // TODO: Optional - Verify user has access to this team
    // const user = await getAuthenticatedUser();
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Generate insights for the team
    const insights = await insightService.generateInsights(teamId);

    return NextResponse.json({
      insights,
      count: insights.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
