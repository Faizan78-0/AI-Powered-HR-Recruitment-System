import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    const cookieStore = await cookies();
    
    // Get all cookie names
    const allCookies = cookieStore.getAll();

    // Iterate through and expire each one
    allCookies.forEach((cookie) => {
        cookieStore.set({
            name: cookie.name,
            value: '',
            expires: new Date(0), // Sets expiration to 1970
            path: '/',            // Ensure it covers the entire domain
        });
    });

    return NextResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
    );
}