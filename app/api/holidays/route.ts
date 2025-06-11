import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

type Holiday = {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
};

type CacheValue = {
    data: Holiday[];
    expiresAt: number;
};

const cache: Record<string, CacheValue> = {};
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 години

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const year = searchParams.get('year');
    const country = searchParams.get('country');

    if (!year || !country) {
        return NextResponse.json({ message: 'Missing year or country' }, { status: 400 });
    }

    const cacheKey = `${year}-${country}`;
    const now = Date.now();

    // Якщо є в кеші — повертаємо з кешу
    if (cache[cacheKey] && cache[cacheKey].expiresAt > now) {
        return NextResponse.json(cache[cacheKey].data);
    }

    try {
        const response = await axios.get<Holiday[]>(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
        );

        cache[cacheKey] = {
            data: response.data,
            expiresAt: now + CACHE_TTL_MS,
        };

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json({ message: 'Error fetching holidays' }, { status: 500 });
    }
}