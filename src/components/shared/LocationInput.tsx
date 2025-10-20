'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationInputProps {
  city: string;
  country: string;
  onLocationChange: (data: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
  }) => void;
  label?: string;
  placeholder?: string;
}

interface Suggestion {
  display_name: string;
  address: any;
  lat: string;
  lon: string;
}

export default function LocationInput({
  city,
  country,
  onLocationChange,
  label = 'Location',
  placeholder = 'Enter city and country (e.g., New York, USA)',
}: LocationInputProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize search value from props
  useEffect(() => {
    if (city && country) {
      setSearchValue(`${city}, ${country}`);
    } else if (city) {
      setSearchValue(city);
    } else if (country) {
      setSearchValue(country);
    }
  }, [city, country]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions as user types
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    }
  };

  const geocodeAddress = async (address: string, result?: Suggestion) => {
    if (!address.trim()) {
      return;
    }

    setIsGeocoding(true);
    setShowSuggestions(false);
    
    try {
      let data;
      
      // If we have a result from autocomplete, use it directly
      if (result) {
        data = [result];
      } else {
        // Otherwise, fetch from API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`
        );
        data = await response.json();
      }

      if (data && data.length > 0) {
        const locationResult = data[0];
        const address_parts = locationResult.address || {};
        
        // Extract city and country
        const extractedCity = 
          address_parts.city || 
          address_parts.town || 
          address_parts.village || 
          address_parts.municipality ||
          address_parts.county ||
          '';
        
        const extractedCountry = address_parts.country || '';
        
        // Get timezone from coordinates
        let timezone = '';
        try {
          const tzResponse = await fetch(
            `https://api.wheretheiss.at/v1/coordinates/${locationResult.lat},${locationResult.lon}`
          );
          const tzData = await tzResponse.json();
          timezone = tzData.timezone_id || '';
        } catch (tzError) {
          timezone = guessTimezoneFromCountry(extractedCountry);
        }

        onLocationChange({
          city: extractedCity,
          country: extractedCountry,
          latitude: parseFloat(locationResult.lat),
          longitude: parseFloat(locationResult.lon),
          timezone,
        });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const guessTimezoneFromCountry = (country: string): string => {
    const countryTimezones: Record<string, string> = {
      'United States': 'America/New_York',
      'USA': 'America/New_York',
      'United Kingdom': 'Europe/London',
      'UK': 'Europe/London',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'Spain': 'Europe/Madrid',
      'Italy': 'Europe/Rome',
      'Japan': 'Asia/Tokyo',
      'China': 'Asia/Shanghai',
      'Australia': 'Australia/Sydney',
      'Canada': 'America/Toronto',
      'India': 'Asia/Kolkata',
      'Brazil': 'America/Sao_Paulo',
      'Mexico': 'America/Mexico_City',
      'Singapore': 'Asia/Singapore',
      'Netherlands': 'Europe/Amsterdam',
      'Switzerland': 'Europe/Zurich',
      'Sweden': 'Europe/Stockholm',
      'Norway': 'Europe/Oslo',
      'Denmark': 'Europe/Copenhagen',
      'Finland': 'Europe/Helsinki',
      'Poland': 'Europe/Warsaw',
      'Austria': 'Europe/Vienna',
      'Belgium': 'Europe/Brussels',
      'Ireland': 'Europe/Dublin',
      'Portugal': 'Europe/Lisbon',
      'Greece': 'Europe/Athens',
      'Turkey': 'Europe/Istanbul',
      'Russia': 'Europe/Moscow',
      'South Korea': 'Asia/Seoul',
      'Thailand': 'Asia/Bangkok',
      'Vietnam': 'Asia/Ho_Chi_Minh',
      'Malaysia': 'Asia/Kuala_Lumpur',
      'Indonesia': 'Asia/Jakarta',
      'Philippines': 'Asia/Manila',
      'New Zealand': 'Pacific/Auckland',
      'South Africa': 'Africa/Johannesburg',
      'UAE': 'Asia/Dubai',
      'Saudi Arabia': 'Asia/Riyadh',
      'Argentina': 'America/Argentina/Buenos_Aires',
      'Chile': 'America/Santiago',
      'Colombia': 'America/Bogota',
    };

    return countryTimezones[country] || 'UTC';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Debounce autocomplete requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const address_parts = suggestion.address || {};
    const cityName = 
      address_parts.city || 
      address_parts.town || 
      address_parts.village || 
      address_parts.municipality ||
      '';
    const countryName = address_parts.country || '';
    
    setSearchValue(`${cityName}, ${countryName}`);
    geocodeAddress(`${cityName}, ${countryName}`, suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(searchValue);
    }
  };

  return (
    <div ref={wrapperRef}>
      <label htmlFor="location-input" className="label">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
        <input
          id="location-input"
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isGeocoding}
          className="input pl-10 pr-10"
          autoComplete="off"
        />
        {isGeocoding && (
          <Loader2 
            className="absolute right-3 text-primary-600 w-5 h-5 animate-spin pointer-events-none z-10" 
            style={{ top: '50%', marginTop: '-10px' }}
          />
        )}
        
        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[110] w-full mt-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.municipality}
                      {suggestion.address?.country && `, ${suggestion.address.country}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Start typing to see suggestions
      </p>
      {city && country && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ {city}, {country}
        </p>
      )}
    </div>
  );
}
