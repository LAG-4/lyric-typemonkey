'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { songs } from '@/data/songs';

export default function PlayRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the first song or a default one
    if (songs.length > 0) {
      router.replace(`/play/${songs[0].id}`);
    } else {
      router.replace('/'); // Redirect to home if no songs
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <p>Redirecting to song...</p>
    </div>
  );
} 