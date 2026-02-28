import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-static";
import ytsr from 'ytsr';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
        // Search YouTube
        const filters1 = await ytsr.getFilters(query);
        const filter1 = filters1.get('Type')?.get('Video');

        if (!filter1?.url) {
            return NextResponse.json({ results: [] });
        }

        const searchResults = await ytsr(filter1.url, { limit: 10 });

        // Map to our Track interface
        const results = searchResults.items
            .filter(item => item.type === 'video')
            .map((item: any) => ({
                id: item.id,
                title: item.title,
                artist: item.author?.name || 'YouTube Music',
                url: item.url,
                thumbnail: item.bestThumbnail?.url,
                source: 'youtube',
                duration: item.duration // Optional in Track interface
            }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Music Search API Error:', error);
        return NextResponse.json({ error: 'Search failed', details: String(error) }, { status: 500 });
    }
}
