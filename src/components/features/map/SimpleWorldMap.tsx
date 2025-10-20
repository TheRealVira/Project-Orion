'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Graticule,
} from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { Avatar, UserCard } from '@/components/shared';
import { Home, Plus, Minus } from 'lucide-react';
import { calculateTerminator } from '@/lib/map';
import { generateShadowPath } from '@/lib/map';
import { useTheme } from '@/contexts/ThemeContext';
import UserDetailModal from './UserDetailModal';
import UsersListModal from './UsersListModal';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'admin' | 'user' | 'viewer';
  city?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  onCall?: boolean;
}

interface SimpleWorldMapProps {
  users: User[];
}

// TopoJSON world map from Natural Earth
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function SimpleWorldMap({ users }: SimpleWorldMapProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [hoveredUser, setHoveredUser] = useState<null | { user: User; mouseX: number; mouseY: number }>(null);
  const [terminatorCoords, setTerminatorCoords] = useState<Array<[number, number]>>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const zoomableGroupRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Ensure zoom is always valid
  const safeZoom = Math.max(1, zoom || 1);
  const isValidZoom = !Number.isNaN(zoom) && zoom > 0;

  // Get the active time (simulated or current)
  const activeTime = simulatedTime || currentTime;

  // Reset map to default view
  const resetView = () => {
    setZoom(1);
    setCenter([0, 0]);
    setResetTrigger(prev => prev + 1);
  };

  // Time control functions
  const resetToNow = () => {
    setSimulatedTime(null);
  };

  // Slider value: -24 to +24 hours from current time
  const getSliderValue = () => {
    if (!simulatedTime) return 0;
    const diffMs = simulatedTime.getTime() - currentTime.getTime();
    return diffMs / (60 * 60 * 1000); // Convert to hours
  };

  const handleSliderChange = (value: number) => {
    const offsetMs = value * 60 * 60 * 1000; // Convert hours to milliseconds
    const newTime = new Date(currentTime.getTime() + offsetMs);
    setSimulatedTime(newTime);
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom(Math.min(8, zoom * 1.5));
  };

  const zoomOut = () => {
    setZoom(Math.max(1, zoom / 1.5));
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll wheel zoom on the map
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.8 : 1.2;
      const newZoom = Math.max(1, Math.min(8, zoom * zoomFactor));
      setZoom(newZoom);
    };

    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => mapElement.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Group users by location
  const locationMap = useMemo(() => {
    const map: Record<string, User[]> = {};
    users.forEach(user => {
      if (user.latitude == null || user.longitude == null) return;
      const key = `${user.latitude},${user.longitude}`;
      if (!map[key]) map[key] = [];
      map[key].push(user);
    });
    return map;
  }, [users]);

  // Calculate statistics
  const stats = {
    total: users.length,
    onCall: users.filter(u => u.onCall).length,
    notOnCall: users.filter(u => !u.onCall).length,
  };

  // Sun and moon positions
  const [sunPosition, setSunPosition] = useState<[number, number] | null>(null);
  const [moonPosition, setMoonPosition] = useState<[number, number] | null>(null);

  // Calculate terminator (day/night boundary) coordinates
  useEffect(() => {
    function updateTerminator() {
      const data = calculateTerminator(activeTime);
      setSunPosition([data.sunPosition.longitude, data.sunPosition.latitude]);
      setMoonPosition([data.moonPosition.longitude, data.moonPosition.latitude]);
      setTerminatorCoords(data.terminatorCoords);
    }
    
    updateTerminator();
    // Only auto-update if not in simulation mode
    if (!simulatedTime) {
      const interval = setInterval(updateTerminator, 60000); // update every minute
      return () => clearInterval(interval);
    }
  }, [activeTime, simulatedTime]);

  return (
    <>
      <div className="w-full h-full relative flex flex-col">
        {/* Map Container */}
        <div ref={mapRef} className="flex-1 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-md overflow-hidden relative border border-gray-200/50 dark:border-gray-700/50 rounded-2xl" style={{ boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05)' }}>
      {/* Home/Reset Button */}
      <button
        onClick={resetView}
        className="absolute top-4 left-4 backdrop-blur-md rounded-xl shadow-lg border p-2 z-40 transition-all duration-200 bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
        style={{
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        }}
        title="Reset map view"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute top-16 left-4 flex flex-col gap-2 z-40">
        <button
          onClick={zoomIn}
          className="backdrop-blur-md rounded-xl shadow-lg border p-2 transition-all duration-200 bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
          title="Zoom in"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="backdrop-blur-md rounded-xl shadow-lg border p-2 transition-all duration-200 bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
          title="Zoom out"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          }}
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline Slider Controls - REMOVED, merged with legend */}

      <ComposableMap
        projectionConfig={{
          scale: 147,
        }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          key={resetTrigger}
          zoom={zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(position) => {
            const newZoom = position.zoom;
            if (newZoom && !Number.isNaN(newZoom) && newZoom > 0) {
              setZoom(newZoom);
            }
            if (position.coordinates) {
              setCenter(position.coordinates);
            }
          }}
        >

          {/* SVG filter to expand shadow slightly */}
          <defs>
            <filter id="expandShadow">
              <feMorphology operator="dilate" radius="1.5" />
            </filter>
          </defs>

          {/* Timezone lines (meridians) */}
          <Graticule
            stroke={isDark ? "#42474eff" : "#9CA3AF"}
            strokeWidth={1 / safeZoom}
          />
          <Geographies geography={geoUrl}>
            {({ geographies, projection }) => (
              <>
                {geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isDark ? '#4B5563' : '#D1D5DB', // gray-600 : gray-300
                        stroke: isDark ? '#1F2937' : '#9CA3AF', // gray-800 : gray-400
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: '#6B7280', // gray-500
                        stroke: '#374151', // gray-700
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: '#6B7280', // gray-500
                        stroke: '#374151', // gray-700
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                ))}
                
                {/* Night shadow overlay - render after countries */}
                {terminatorCoords.length > 0 && (() => {
                  const shadowPath = generateShadowPath(terminatorCoords, projection, zoom, sunPosition ? { longitude: sunPosition[0], latitude: sunPosition[1] } : null);
                  if (!shadowPath) return null;
                  
                  return (
                    <path
                      d={shadowPath}
                      fill="#000000"
                      fillOpacity={isDark ? 0.3 : 0.25}
                      stroke="none"
                      filter="url(#expandShadow)"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })()}
              </>
            )}
          </Geographies>

          {/* User markers - cluster for overlapping users */}
          {Object.entries(locationMap).map(([key, userGroup], idx) => {
            const [lat, lng] = key.split(',').map(Number);
            const safeZoom = Math.max(1, zoom || 1);
            const scale = 1 / safeZoom;
            if (userGroup.length === 1) {
              const user = userGroup[0];
              return (
                <Marker key={user.id} coordinates={[lng, lat]}>
                  <g
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedUsers(null);
                    }}
                    onMouseEnter={e => {
                      if (!mapRef.current) return;
                      const rect = mapRef.current.getBoundingClientRect();
                      setHoveredUser({
                        user,
                        mouseX: e.clientX - rect.left,
                        mouseY: e.clientY - rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredUser(null)}
                    style={{ overflow: 'visible' }}
                  >
                    <foreignObject
                      x={-16}
                      y={-16}
                      width={32}
                      height={32}
                      style={{ overflow: 'visible', pointerEvents: 'none' }}
                    >
                      <div
                        className="w-8 h-8 hover:scale-110 transition-transform"
                        style={{ transform: `scale(${scale})`, transformOrigin: 'center', zIndex: 1, pointerEvents: 'auto' }}
                      >
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.name}
                          size="md"
                          className={`ring-2 shadow-lg ${user.onCall ? 'ring-red-500 animate-ring-blink' : 'ring-primary-400'}`}
                        />
                      </div>
                    </foreignObject>
                  </g>
                </Marker>
              );
            } else {
              // Cluster marker
              const hasOnCallUser = userGroup.some(u => u.onCall);
              return (
                <Marker key={key} coordinates={[lng, lat]}>
                  <g
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedUsers(userGroup);
                      setSelectedUser(null);
                    }}
                    style={{ overflow: 'visible' }}
                  >
                    <foreignObject
                      x={-16}
                      y={-16}
                      width={32}
                      height={32}
                      style={{ overflow: 'visible', pointerEvents: 'none' }}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-white font-bold text-base rounded-full border-2 shadow-lg ${
                          hasOnCallUser
                            ? 'bg-red-600 border-red-400 animate-ring-blink'
                            : 'bg-primary-600 border-primary-300'
                        }`}
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: 'center',
                          zIndex: 1,
                          pointerEvents: 'auto',
                        }}
                      >
                        {userGroup.length}
                      </div>
                    </foreignObject>
                  </g>
                </Marker>
              );
            }
          })}
          
          {/* Sun marker */}
          {sunPosition && (
            <Marker coordinates={sunPosition}>
              <g style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <text
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={16 / safeZoom}
                  fill="#FDB813"
                  opacity={0.4}
                >
                  🔆️
                </text>
              </g>
            </Marker>
          )}
          
          {/* Moon marker */}
          {moonPosition && (
            <Marker coordinates={moonPosition}>
              <g style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <text
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={14 / safeZoom}
                  fill="#E0E0E0"
                  opacity={0.4}
                >
                  🌑
                </text>
              </g>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

        {/* Glasmorphic Legend with Time Travel Slider - Merged */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-white/40 dark:bg-gray-800/40 px-4 md:px-6 py-3 md:py-4 border-t border-gray-300/50 dark:border-gray-600/50 shadow-lg z-40 rounded-2xl"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 -4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-xs">
            {/* Time Display */}
            <div className="flex flex-col items-center min-w-fit gap-0.5 flex-shrink-0">
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                {activeTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <div className="h-4 flex items-center">
                {simulatedTime && (
                  <div className="text-primary-600 dark:text-primary-400 text-[9px] font-semibold whitespace-nowrap">Time Travel</div>
                )}
              </div>
            </div>

            {/* Slider with Labels */}
            <div className="min-w-[120px] md:w-[250px] flex-shrink-0">
              <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1 px-1">
                <span>-24h</span>
                <span className="text-[8px]">Now</span>
                <span>+24h</span>
              </div>
              <input
                type="range"
                min="-24"
                max="24"
                step="0.25"
                value={getSliderValue()}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-transparent"
                title="Adjust time (drag to time travel)"
                style={{
                  background: `linear-gradient(to right, rgba(209, 213, 219, 0.3) 0%, rgba(59, 130, 246, 0.6) ${((getSliderValue() + 24) / 48) * 100}%, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.6) ${((getSliderValue() + 24) / 48) * 100}%, rgba(209, 213, 219, 0.3) 100%)`
                }}
              />
            </div>

            {/* Reset Button */}
            <div className="w-14 md:w-16 flex-shrink-0">
              {simulatedTime && (
                <button
                  onClick={resetToNow}
                  className="w-full px-2 md:px-2 py-1 text-xs font-semibold text-gray-800 dark:text-white bg-white/40 dark:bg-gray-800/40 hover:bg-white/50 dark:hover:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg transition-all duration-200 whitespace-nowrap"
                  title="Return to current time"
                  style={{
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Vertical Divider - Hidden on mobile */}
            <div className="hidden md:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 flex-shrink-0"></div>

            {/* Stats */}
            <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span className="text-gray-900 dark:text-white font-bold">{stats.total}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">On-Call:</span>
                <span className="text-gray-900 dark:text-white font-bold">{stats.onCall}</span>
              </div>
            </div>

            {/* Vertical Divider - Hidden on mobile */}
            <div className="hidden md:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 flex-shrink-0"></div>
            
            {/* Legend Items */}
            <div className="flex items-center gap-2 md:gap-5 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🔆</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🌑</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Night</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-4 h-1 bg-black bg-opacity-50 border border-gray-400 dark:border-gray-500"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Terminator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      <UsersListModal
        isOpen={selectedUsers !== null}
        onClose={() => setSelectedUsers(null)}
        users={selectedUsers || []}
        onUserClick={(user) => {
          setSelectedUsers(null);
          setSelectedUser(user);
        }}
        referenceTime={activeTime}
      />

      <UserDetailModal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        user={selectedUser!}
        referenceTime={activeTime}
      />

      {/* User Hover Tooltip (HTML, not SVG) - Desktop only - Outside overflow container */}
      {hoveredUser && !isMobile && (() => {
        const tooltipWidth = 300;
        const tooltipHeight = 150; // Approximate height
        const padding = 10;
        
        // Get map dimensions
        const mapWidth = mapRef.current?.clientWidth || 800;
        const mapHeight = mapRef.current?.clientHeight || 600;
        
        // Center the tooltip horizontally on the cursor
        let left = hoveredUser.mouseX - tooltipWidth / 2;
        
        // Keep tooltip within horizontal bounds
        if (left < padding) left = padding;
        if (left + tooltipWidth > mapWidth - padding) left = mapWidth - tooltipWidth - padding;
        
        // Position tooltip above cursor by default
        let top = hoveredUser.mouseY - tooltipHeight - 20;
        
        // If tooltip would go above the map, position it below the cursor instead
        if (top < padding) {
          top = hoveredUser.mouseY + 20;
        }
        
        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{ 
              left: left, 
              top: top, 
              width: tooltipWidth
            }}
          >
            <div className="glass-tooltip px-3 py-2 text-xs">
              <UserCard user={hoveredUser.user} size="md" showEmail={true} showLocation={true} showRole={true} referenceTime={activeTime} />
            </div>
          </div>
        );
      })()}
    </>
  );
}
