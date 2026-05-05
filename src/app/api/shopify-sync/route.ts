// src/app/api/shopify-sync/route.ts
import { trackCustomerData } from '@/lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shopify-sync
 * Syncs student registration data with Shopify Customer Fields
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, schoolName, university, email } = body;

    if (!customerId || !schoolName || !university) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, schoolName, university' },
        { status: 400 }
      );
    }

    // Track customer data in Shopify
    const result = await trackCustomerData(customerId, schoolName, university);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to sync with Shopify' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student data synced to Shopify',
      customerId,
      university,
    });
  } catch (error) {
    console.error('Shopify sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shopify-sync?customerId=xxx
 * Retrieves student data from Shopify
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }

    // Fetch customer data from Shopify
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2026-01/customers/${customerId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    const metafields = data.customer.metafields || [];

    return NextResponse.json({
      customerId,
      email: data.customer.email,
      schoolName: metafields.find((m: any) => m.key === 'school_name')?.value,
      university: metafields.find((m: any) => m.key === 'university')?.value,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
