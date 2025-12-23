// @ts-ignore
// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { MarkerClusterer } from "@googlemaps/markerclusterer";

// @ts-ignore
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB-Xk8yGUg9ejl0fb_XiZqeJP1pkWJPJa4';

export default function GoogleMap({
  center = { lat: 9.5, lng: 100.0 },
  zoom = 13,
  markers = [],
  onMapClick = null,
  options = {},
  userLocation = null,
  userAvatar = null,
  height = "400px",
  polylines = []
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const markerClustererRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userOverlayRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        setLoading(false);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    const loadScript = () => {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
      if (existingScript) {
        // Check periodically if maps is ready, since 'load' event might have passed
        const checkInterval = setInterval(() => {
          if (checkGoogleMaps()) {
            clearInterval(checkInterval);
          }
        }, 100);

        // Safety timeout
        setTimeout(() => clearInterval(checkInterval), 5000);

        existingScript.addEventListener('load', () => {
          setTimeout(() => checkGoogleMaps(), 100);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&language=he&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';

      script.onload = () => {
        setTimeout(() => {
          if (checkGoogleMaps()) return;
          setTimeout(() => checkGoogleMaps(), 500);
        }, 100);
      };

      script.onerror = (e) => {
        console.error('Failed to load Google Maps script:', e);
        setError('שגיאה בטעינת Google Maps');
        setLoading(false);
      };

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      // Cleanup markers on unmount
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }
      markersRef.current.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

      polylinesRef.current.forEach(polyline => {
        if (polyline.setMap) polyline.setMap(null);
      });
      polylinesRef.current = [];

      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (!loading && !error && mapRef.current && window.google && window.google.maps) {
      if (!googleMapRef.current) {
        initMap();
      } else {
        updateMapAndMarkers();
      }
    }
  }, [loading, error, center, markers, zoom, options, userLocation, polylines]);

  // Handle dynamic resizing
  useEffect(() => {
    if (!mapRef.current || !googleMapRef.current) return;

    const observer = new ResizeObserver(() => {
      if (googleMapRef.current && window.google) {
        // @ts-ignore
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
        // Re-center map after resize
        // @ts-ignore
        const currentCenter = googleMapRef.current.getCenter();
        if (currentCenter) {
          googleMapRef.current.setCenter(currentCenter);
        }
      }
    });

    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  const initMap = () => {
    try {
      // @ts-ignore
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        disableDefaultUI: true, // Disable all default UI
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        keyboardShortcuts: false, // Disable keyboard shortcuts
        clickableIcons: false, // Disable clickable POIs
        mapTypeId: 'roadmap',
        ...options
      });

      googleMapRef.current = map;

      if (onMapClick) {
        map.addListener('click', (e) => {
          onMapClick({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          });
        });
      }

      updateMapAndMarkers();
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('שגיאה באתחול המפה: ' + err.message);
    }
  };

  const activeInfoWindowRef = useRef(null);

  const updateMapAndMarkers = () => {
    // @ts-ignore
    if (!googleMapRef.current || !window.google) return;

    try {
      // Update center
      // @ts-ignore
      const newCenter = new window.google.maps.LatLng(center.lat, center.lng);
      googleMapRef.current.setCenter(newCenter);
      googleMapRef.current.setZoom(zoom);

      // Clear old markers and clusterer
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Handle User Location Marker
      // Handle User Location Marker
      if (userLocation) {
        if (userAvatar) {
          // Remove standard marker if exists
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
            userMarkerRef.current = null;
          }

          // Define Overlay Class if not exists globally or locally
          if (!window.UserAvatarOverlay) {
            window.UserAvatarOverlay = class extends window.google.maps.OverlayView {
              constructor(position, avatarUrl) {
                super();
                this.position = position;
                this.avatarUrl = avatarUrl;
                this.div = null;
              }
              onAdd() {
                this.div = document.createElement('div');
                this.div.style.position = 'absolute';
                this.div.style.width = '44px';
                this.div.style.height = '44px';
                this.div.style.borderRadius = '50%';
                this.div.style.backgroundColor = 'white';
                this.div.style.border = '3px solid #EF4444'; // Red border
                this.div.style.backgroundImage = `url(${this.avatarUrl})`;
                this.div.style.backgroundSize = 'cover';
                this.div.style.backgroundPosition = 'center';
                this.div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                this.div.style.cursor = 'pointer';
                this.div.className = 'user-location-pulse'; // Optional hook for CSS animation

                const panes = this.getPanes();
                panes.overlayMouseTarget.appendChild(this.div); // overlayMouseTarget allows clicks
              }
              draw() {
                const overlayProjection = this.getProjection();
                if (!overlayProjection || !this.position) return;
                const coords = overlayProjection.fromLatLngToDivPixel(this.position);
                if (this.div && coords) {
                  this.div.style.left = (coords.x - 22) + 'px';
                  this.div.style.top = (coords.y - 22) + 'px';
                }
              }
              onRemove() {
                if (this.div) {
                  this.div.parentNode.removeChild(this.div);
                  this.div = null;
                }
              }
              setPosition(position) {
                this.position = position;
                this.draw();
              }
            };
          }

          const pos = new window.google.maps.LatLng(userLocation.latitude || userLocation.lat, userLocation.longitude || userLocation.lng);

          if (!userOverlayRef.current) {
            // @ts-ignore
            userOverlayRef.current = new window.UserAvatarOverlay(pos, userAvatar);
            userOverlayRef.current.setMap(googleMapRef.current);
          } else {
            userOverlayRef.current.setPosition(pos);
          }

        } else {
          // No Avatar - Use standard marker
          // Remove overlay if exists
          if (userOverlayRef.current) {
            userOverlayRef.current.setMap(null);
            userOverlayRef.current = null;
          }

          const markerOptions = {
            position: { lat: userLocation.latitude || userLocation.lat, lng: userLocation.longitude || userLocation.lng },
            map: googleMapRef.current,
            title: 'המיקום שלי',
            icon: {
              // @ts-ignore
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            },
            zIndex: 999
          };

          if (!userMarkerRef.current) {
            // @ts-ignore
            userMarkerRef.current = new window.google.maps.Marker(markerOptions);
          } else {
            // @ts-ignore
            userMarkerRef.current.setPosition(markerOptions.position);
            // @ts-ignore
            userMarkerRef.current.setIcon(markerOptions.icon);
            userMarkerRef.current.setMap(googleMapRef.current);
          }
        }
      } else {
        // No location
        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
          userMarkerRef.current = null;
        }
        if (userOverlayRef.current) {
          userOverlayRef.current.setMap(null);
          userOverlayRef.current = null;
        }
      }

      // Add new markers
      markers.forEach(markerData => {
        const markerOptions = {
          position: { lat: markerData.lat, lng: markerData.lng },
          // map: googleMapRef.current, // Don't set map here, clusterer will handle it
          title: markerData.title || '',
        };

        if (markerData.icon) {
          markerOptions.icon = markerData.icon;
        }

        // @ts-ignore
        const marker = new window.google.maps.Marker(markerOptions);

        if (markerData.infoWindow) {
          // @ts-ignore
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoWindow
          });

          marker.addListener('click', () => {
            // Close currently open InfoWindow if exists
            if (activeInfoWindowRef.current) {
              activeInfoWindowRef.current.close();
            }

            infoWindow.open(googleMapRef.current, marker);
            activeInfoWindowRef.current = infoWindow;
          });
        }

        // Allow handling click events on markers even without info windows
        if (markerData.onClick) {
          marker.addListener('click', () => {
            markerData.onClick();
          });
        }

        markersRef.current.push(marker);
      });

      // Initialize or update clusterer
      if (markersRef.current.length > 0) {
        if (!markerClustererRef.current) {
          markerClustererRef.current = new MarkerClusterer({
            map: googleMapRef.current,
            markers: markersRef.current
          });
        } else {
          markerClustererRef.current.addMarkers(markersRef.current);
        }
      }

      // Handle Polylines
      // Clear old polylines
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      polylinesRef.current = [];

      // Add new polylines
      polylines.forEach(polylineData => {
        // @ts-ignore
        const polyline = new window.google.maps.Polyline({
          path: polylineData.path,
          geodesic: true,
          strokeColor: polylineData.strokeColor || "#FF0000",
          strokeOpacity: polylineData.strokeOpacity || 1.0,
          strokeWeight: polylineData.strokeWeight || 2,
          map: googleMapRef.current,
          ...polylineData.options
        });
        polylinesRef.current.push(polyline);
      });

    } catch (err) {
      console.error('Error updating markers:', err);
    }
  };

  if (loading) {
    return (
      <div
        style={{ width: '100%', height: height, minHeight: height }}
        className="rounded-lg bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">טוען מפה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ width: '100%', height: height, minHeight: height }}
        className="rounded-lg bg-red-50 flex items-center justify-center border-2 border-red-200"
      >
        <div className="text-center p-4 max-w-md">
          <p className="text-red-600 font-semibold mb-2">⚠️ שגיאה</p>
          <p className="text-sm text-red-600 mb-3">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: height, minHeight: height }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: height,
          position: 'relative',
          display: 'block'
        }}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
}

GoogleMap.propTypes = {
  center: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  zoom: PropTypes.number,
  markers: PropTypes.arrayOf(PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    title: PropTypes.string,
    infoWindow: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    onClick: PropTypes.func
  })),
  onMapClick: PropTypes.func,
  height: PropTypes.string,
  options: PropTypes.object,
  userLocation: PropTypes.object,
  polylines: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.arrayOf(PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired
    })).isRequired,
    strokeColor: PropTypes.string,
    strokeOpacity: PropTypes.number,
    strokeWeight: PropTypes.number,
    options: PropTypes.object
  }))
};