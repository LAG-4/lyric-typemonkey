import { songs } from '@/data/songs';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-2">LyricType</h1>
      <p className="text-gray-400 mb-12">Test your typing skills with song lyrics</p>
      
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">Available Songs</h2>
        
        <div className="grid gap-4">
          {songs.map((song) => (
            <Link 
              key={song.id}
              href={`/play/${song.id}`}
              className="block bg-zinc-800 hover:bg-zinc-700 p-4 rounded-md transition-colors"
            >
              <h3 className="text-lg font-medium">{song.title}</h3>
              <p className="text-gray-400">{song.artist}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
