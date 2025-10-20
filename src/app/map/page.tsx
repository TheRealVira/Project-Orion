import { WorldMap } from '@/components/features/map';

export default function MapPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Map</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View team members locations and timezones around the world
        </p>
      </div>
      <WorldMap />
    </div>
  );
}
