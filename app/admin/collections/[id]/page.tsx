import Link from 'next/link';
import CollectionEditor from '@/components/CollectionEditor';

export const dynamic = 'force-dynamic';

export default function AdminCollectionDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-8">
      <Link href="/admin/collections" className="text-text-dim hover:text-gold">
        ← Collections
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-text">Edit collection</h1>

      <div className="mt-6">
        <CollectionEditor collectionId={params.id} />
      </div>
    </main>
  );
}