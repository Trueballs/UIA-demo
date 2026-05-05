// Helper to resolve a university logo URL.
// Prefers locally downloaded file; falls back to Clearbit.
export function getLogoUrl(domain: string): string {
    return `/api/logo?domain=${encodeURIComponent(domain)}`;
}
