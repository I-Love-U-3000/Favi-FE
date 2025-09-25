'use client';
import React, { useState, useEffect } from 'react';
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteSelectEvent } from 'primereact/autocomplete';
import axios from 'axios';

interface LocationIQSuggestion {
  place_name: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  type: string;
}

interface SelectedPlace {
  placeName: string;
  coordinates: [number, number]; // [lng, lat]
  fullAddress: string;
}

interface LocationIQAutoCompleteProps {
  apiKey: string;
  proximity?: string; // Format: "lng,lat"
  onSelect?: (place: SelectedPlace) => void;
  placeholder?: string;
  className?: string;
}

const LocationIQAutoComplete: React.FC<LocationIQAutoCompleteProps> = ({
  apiKey,
  proximity = '106.694945,10.769034',
  onSelect,
  placeholder = 'Tìm kiếm địa chỉ...',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<LocationIQSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true);
    try {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn&language=vi&proximity=${proximity}`;
      const response = await axios.get(url);
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Lỗi gọi LocationIQ API:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const onSuggestionSelect = (e: AutoCompleteSelectEvent) => {
    const feature = e.value as LocationIQSuggestion;
    const addressParts = [
      feature.address.road,
      feature.address.city,
      feature.address.state,
      feature.address.country,
      feature.address.postcode,
    ].filter(Boolean).join(', ');
    const place: SelectedPlace = {
      placeName: feature.display_name,
      coordinates: [parseFloat(feature.lon), parseFloat(feature.lat)],
      fullAddress: addressParts,
    };
    setSelectedPlace(place);
    setQuery(feature.display_name);
    onSelect?.(place);
  };

  const itemTemplate = (suggestion: LocationIQSuggestion) => {
    const addressParts = [
      suggestion.address.road,
      suggestion.address.city,
      suggestion.address.state,
      suggestion.address.country,
    ].filter(Boolean).join(', ');
    return (
      <div className="flex align-items-center p-2">
        <i className="pi pi-map-marker mr-2" style={{ color: 'var(--primary-color)' }} />
        <div>
          <div className="font-bold">{suggestion.display_name}</div>
          <div className="text-sm text-gray-600">{addressParts}</div>
          <small className="text-xs text-gray-400">{suggestion.type}</small>
        </div>
      </div>
    );
  };

  const handleClearSelection = () => {
    setSelectedPlace(null);
    setQuery('');
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <AutoComplete
          value={query}
          suggestions={suggestions}
          completeMethod={() => {}} // UseEffect handles autocomplete
          field="display_name"
          onChange={(e: AutoCompleteChangeEvent) => setQuery(e.value as string)}
          onSelect={onSuggestionSelect}
          itemTemplate={itemTemplate}
          placeholder={placeholder}
          dropdown
          forceSelection={false}
          className="w-full"
          inputClassName="w-full pr-8" // Add padding for spinner
        />
        {loading && (
          <i
            className="pi pi-spin pi-spinner absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            style={{ fontSize: '1rem' }}
          />
        )}
      </div>
      {selectedPlace && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm flex align-items-center">
          <i className="pi pi-map-marker mr-2" style={{ color: 'var(--primary-color)' }} />
          <div className="flex-1">
            <div className="font-bold">{selectedPlace.placeName}</div>
            <div>
              <strong>Tọa độ:</strong> {selectedPlace.coordinates.join(', ')}
            </div>
            <div>
              <strong>Địa chỉ đầy đủ:</strong>{' '}
              <a
                href={`https://www.google.com/maps?q=${selectedPlace.coordinates[1]},${selectedPlace.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700"
              >
                {selectedPlace.fullAddress}
              </a>
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="ml-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none"
            aria-label="Xóa lựa chọn"
          >
            <i className="pi pi-times" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationIQAutoComplete;