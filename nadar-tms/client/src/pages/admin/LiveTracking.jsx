import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { FLEET_ROAD_ROUTES } from '../../data/fleetRoadRoutes';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapGeoJSON,
  MapRoute,
  createGeoJSONCircle,
} from '@/components/ui/map';
import {
  Play,
  RefreshCw,
  Send,
  Radio,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Phone,
  Compass,
  MapPin,
  Target,
  Zap,
  ExternalLink,
  LocateFixed,
  Activity,
  Settings,
  Server,
  Wifi,
  Cpu,
} from 'lucide-react';

// Nadar Saraswathi Group of Institutions & TMHNU Campuses in Theni
const COLLEGE_CAMPUSES = [
  {
    id: 'vadapudupatti',
    name: 'Nadar Saraswathi Main Campus (Vadapudupatti)',
    shortName: 'Vadapudupatti Campus',
    institutions: 'Engineering & Technology, Arts & Science, Education Colleges',
    center: [77.5082, 10.0427], // [longitude, latitude]
    defaultRadiusKm: 1.5,
  },
  {
    id: 'theni-city',
    name: 'TMHNU City Campus (Theni)',
    shortName: 'Theni City Schools',
    institutions: 'Vidhyalaya Mat. & Girls Hr. Sec. School',
    center: [77.4768, 10.0104], // [longitude, latitude]
    defaultRadiusKm: 1.0,
  },
];

// Helper to compute distance in km between two GPS coordinates
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Helper to calculate compass bearing angle between two coordinates (0-360 deg)
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (Number(startLat) * Math.PI) / 180;
  const startLngRad = (Number(startLng) * Math.PI) / 180;
  const destLatRad = (Number(destLat) * Math.PI) / 180;
  const destLngRad = (Number(destLng) * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// 129 Exact Road-Snapped Coordinates from OpenStreetMap Highway Routing
// From Theni Old Bus Stand along NH 183 through Palanichettypatti & Unjampatti into Vadapudupatti College
export const THENI_COLLEGE_ROAD_COORDINATES = [
  [77.476807, 10.0104],
  [77.476803, 10.010562],
  [77.477501, 10.011736],
  [77.477883, 10.01242],
  [77.478081, 10.01281],
  [77.478211, 10.013065],
  [77.478409, 10.013456],
  [77.478534, 10.013768],
  [77.478752, 10.014255],
  [77.478809, 10.014526],
  [77.478843, 10.014682],
  [77.478896, 10.014974],
  [77.478943, 10.015223],
  [77.47897, 10.01533],
  [77.479339, 10.016911],
  [77.479444, 10.017443],
  [77.479479, 10.017624],
  [77.479654, 10.019223],
  [77.479664, 10.019343],
  [77.479657, 10.019528],
  [77.479679, 10.020045],
  [77.479689, 10.020537],
  [77.479716, 10.021101],
  [77.479716, 10.021946],
  [77.479727, 10.022637],
  [77.479627, 10.023514],
  [77.479601, 10.02396],
  [77.479556, 10.024428],
  [77.479404, 10.025814],
  [77.4794, 10.026007],
  [77.479347, 10.026502],
  [77.479388, 10.026828],
  [77.479553, 10.027195],
  [77.479967, 10.028117],
  [77.480058, 10.028355],
  [77.480077, 10.028395],
  [77.480256, 10.028778],
  [77.48089, 10.03013],
  [77.481214, 10.030867],
  [77.48166, 10.031623],
  [77.481747, 10.031742],
  [77.482002, 10.032081],
  [77.482172, 10.032348],
  [77.482263, 10.032494],
  [77.482469, 10.032818],
  [77.482623, 10.033063],
  [77.482792, 10.033329],
  [77.482942, 10.033568],
  [77.48316, 10.033859],
  [77.483369, 10.034242],
  [77.483449, 10.034369],
  [77.483499, 10.034448],
  [77.48418, 10.035308],
  [77.484242, 10.035387],
  [77.484285, 10.035441],
  [77.484705, 10.035882],
  [77.484972, 10.036163],
  [77.485121, 10.036279],
  [77.485269, 10.036422],
  [77.485429, 10.036553],
  [77.485718, 10.03679],
  [77.486064, 10.037084],
  [77.486269, 10.037226],
  [77.487071, 10.037737],
  [77.488219, 10.038425],
  [77.489162, 10.039034],
  [77.489496, 10.039166],
  [77.489881, 10.039305],
  [77.490021, 10.039356],
  [77.490156, 10.039386],
  [77.491013, 10.039577],
  [77.491109, 10.039609],
  [77.491452, 10.039725],
  [77.491872, 10.039935],
  [77.492139, 10.040074],
  [77.493109, 10.040703],
  [77.493653, 10.041055],
  [77.493964, 10.041212],
  [77.49448, 10.041473],
  [77.494738, 10.041604],
  [77.495238, 10.041929],
  [77.495665, 10.042296],
  [77.496046, 10.042676],
  [77.496097, 10.042726],
  [77.49626, 10.042914],
  [77.496434, 10.043117],
  [77.49648, 10.043171],
  [77.496592, 10.043298],
  [77.496697, 10.043416],
  [77.496727, 10.043449],
  [77.496822, 10.043557],
  [77.496979, 10.043734],
  [77.497113, 10.043912],
  [77.497513, 10.043809],
  [77.498438, 10.043674],
  [77.499342, 10.043555],
  [77.500142, 10.043383],
  [77.500774, 10.043256],
  [77.500855, 10.04324],
  [77.501113, 10.043188],
  [77.501777, 10.043089],
  [77.502035, 10.043051],
  [77.502117, 10.043043],
  [77.502458, 10.04301],
  [77.502751, 10.042982],
  [77.502894, 10.043125],
  [77.503223, 10.043259],
  [77.503612, 10.043447],
  [77.503776, 10.043597],
  [77.503905, 10.043814],
  [77.503996, 10.043887],
  [77.504162, 10.04402],
  [77.504479, 10.044081],
  [77.504948, 10.044086],
  [77.505018, 10.044057],
  [77.505313, 10.043935],
  [77.505611, 10.043858],
  [77.505879, 10.043787],
  [77.505991, 10.043756],
  [77.506416, 10.043638],
  [77.506506, 10.043613],
  [77.506625, 10.043571],
  [77.507142, 10.043389],
  [77.507696, 10.043199],
  [77.50784, 10.043088],
  [77.508062, 10.042898],
  [77.508125, 10.042844],
  [77.508215, 10.042768],
  [77.50824, 10.042749]
];

// Calculate realistic road speed along the journey
function getSpeedForRoadStep(step, total) {
  const pct = step / total;
  if (pct < 0.12) return Number((28 + Math.sin(step) * 4).toFixed(1)); // City streets
  if (pct < 0.7) return Number((52 + Math.sin(step) * 6).toFixed(1)); // NH 183 highway
  if (pct < 0.9) return Number((36 + Math.sin(step) * 5).toFixed(1)); // Vadapudupatti approach
  if (pct < 0.98) return Number((18 + Math.sin(step) * 3).toFixed(1)); // College gates
  return 0; // Parked
}

const SAMPLE_VENDOR_PACKETS = [
  {
    name: 'Sample 1 (Moving Bus - Coimbatore Route)',
    packet: '@@863071010318308,,,070739,1100.7754,N,07657.7117,E,0.43,210813,A,0101,1,0,0000,0000,#',
    desc: 'Valid fix, Ignition ON, Speed 0.8 km/h, Lat: 11.0129, Lon: 76.9618'
  },
  {
    name: 'Sample 2 (Stationary Bus - Sivaganga/Madurai Route)',
    packet: '@@863071010320007,,,094237,1005.3769,N,07844.7797,E,0.00,131218,A,0101,1,0,0000,0121,#',
    desc: 'Valid fix, Lat: 10.0896, Lon: 78.7463'
  },
  {
    name: 'Sample 3 (Theni Campus Area)',
    packet: '@@863071010318308,,,083000,1000.6240,N,07728.6080,E,24.50,171026,A,0101,1,0,0000,0000,#',
    desc: 'Active speed 45.4 km/h near Theni Nadar Saraswathi campus'
  },
  {
    name: 'Sample 5 (Inside College Campus - Vadapudupatti Grounds)',
    packet: '@@863071010318308,,,091500,1002.5620,N,07730.4920,E,0.00,171026,A,0101,1,0,0000,0000,#',
    desc: 'Inside Nadar Saraswathi College Campus Grounds (Lat: 10.0427, Lon: 77.5082)'
  },
  {
    name: 'Sample 4 (Invalid Packet "D" - No Fix)',
    packet: '@@868325025798747,,,094159,1004.6261,N,07846.6595,E,0.00,131218,D,0000,1,0,25338,00030,#',
    desc: 'Status D: Rejected by parser because satellite signal is invalid'
  }
];

/**
 * Realistic 3D/Top-Down Vector Bus Vehicle Object
 * Renders an authentic college bus chassis with tires, mirrors, glass windshield,
 * roof AC unit, headlights, taillights, and dynamic 360° road heading rotation.
 */
function BusVehicleObject({
  color = '#f59e0b',
  bearing = 0,
  isSelected = false,
  isMoving = false,
  isInsideCampus = false,
  registration = '',
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 34,
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Rotatable Vehicle Body (Rotates in 360 degrees to match exact road heading) */}
      <div
        style={{
          width: 32,
          height: 64,
          position: 'relative',
          transform: `rotate(${bearing || 0}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.25s ease-out',
          filter: isSelected
            ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.95)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
            : isInsideCampus
            ? 'drop-shadow(0 0 8px rgba(104, 84, 236, 0.8)) drop-shadow(0 3px 6px rgba(0,0,0,0.3))'
            : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))',
        }}
      >
        {/* Forward Headlight Beam projection on road when moving */}
        {isMoving && (
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 48,
              height: 28,
              background: 'radial-gradient(ellipse at bottom, rgba(254, 240, 138, 0.55) 0%, rgba(254, 240, 138, 0) 75%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Scalable Vector College Bus */}
        <svg
          width="32"
          height="64"
          viewBox="0 0 36 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* 4 Rubber Tires with Rim Caps */}
          {/* Left-Front Tire */}
          <rect x="0" y="12" width="3.5" height="11" rx="1.8" fill="#0f172a" />
          <rect x="1" y="15" width="1.5" height="5" rx="0.75" fill="#94a3b8" />
          {/* Right-Front Tire */}
          <rect x="32.5" y="12" width="3.5" height="11" rx="1.8" fill="#0f172a" />
          <rect x="33.5" y="15" width="1.5" height="5" rx="0.75" fill="#94a3b8" />
          {/* Left-Rear Tire */}
          <rect x="0" y="49" width="3.5" height="12" rx="1.8" fill="#0f172a" />
          <rect x="1" y="52" width="1.5" height="6" rx="0.75" fill="#94a3b8" />
          {/* Right-Rear Tire */}
          <rect x="32.5" y="49" width="3.5" height="12" rx="1.8" fill="#0f172a" />
          <rect x="33.5" y="52" width="1.5" height="6" rx="0.75" fill="#94a3b8" />

          {/* Aerodynamic Side Mirrors */}
          <path d="M0 16 L2.5 17 L2.5 19 L0 18 Z" fill="#1e293b" />
          <path d="M36 16 L33.5 17 L33.5 19 L36 18 Z" fill="#1e293b" />

          {/* Main Bus Chassis Body */}
          <rect
            x="3"
            y="5"
            width="30"
            height="62"
            rx="6.5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="1.2"
          />

          {/* Front Bumper & Grill */}
          <rect x="6" y="5" width="24" height="2.5" rx="1.25" fill="#334155" />
          <line x1="12" y1="6.2" x2="24" y2="6.2" stroke="#94a3b8" strokeWidth="0.8" />

          {/* Xenon Headlights */}
          <circle cx="7.5" cy="7.5" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="28.5" cy="7.5" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />

          {/* Front Curved Windshield Glass */}
          <path
            d="M6.5 11 C6.5 9, 29.5 9, 29.5 11 L28.5 19 C28.5 20, 7.5 20, 7.5 19 Z"
            fill="#0284c7"
            stroke="#0f172a"
            strokeWidth="0.8"
          />
          {/* Windshield Glare Reflection */}
          <path d="M10 11.5 L16 11.5 L13 18 L8.5 18 Z" fill="#ffffff" fillOpacity="0.45" />

          {/* Driver Steering Silhouette */}
          <circle cx="12" cy="15" r="1.5" fill="#0f172a" fillOpacity="0.7" />

          {/* Left Passenger Windows (5 windows) */}
          <rect x="4.8" y="22" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="4.8" y="30" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="4.8" y="38" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="4.8" y="46" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="4.8" y="54" width="2.4" height="5.5" rx="0.8" fill="#0284c7" />

          {/* Right Passenger Windows (5 windows) */}
          <rect x="28.8" y="22" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="28.8" y="30" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="28.8" y="38" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="28.8" y="46" width="2.4" height="6" rx="0.8" fill="#0284c7" />
          <rect x="28.8" y="54" width="2.4" height="5.5" rx="0.8" fill="#0284c7" />

          {/* Aerodynamic White Roof Panel */}
          <rect
            x="9"
            y="21"
            width="18"
            height="39"
            rx="3.5"
            fill="#ffffff"
            fillOpacity="0.9"
            stroke="#cbd5e1"
            strokeWidth="0.7"
          />

          {/* Roof AC / Ventilation Unit */}
          <rect x="12" y="26" width="12" height="11" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.7" />
          <line x1="14" y1="29" x2="22" y2="29" stroke="#64748b" strokeWidth="0.7" />
          <line x1="14" y1="32" x2="22" y2="32" stroke="#64748b" strokeWidth="0.7" />
          <line x1="14" y1="35" x2="22" y2="35" stroke="#64748b" strokeWidth="0.7" />

          {/* Emergency Exit Hatch */}
          <rect x="13.5" y="44" width="9" height="9" rx="1.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.7" />
          <text x="18" y="50.5" fontSize="4.5" fontWeight="900" textAnchor="middle" fill="#b45309" fontFamily="sans-serif">
            EXIT
          </text>

          {/* Rear Window */}
          <rect x="7.5" y="62" width="21" height="3" rx="1" fill="#0284c7" stroke="#0f172a" strokeWidth="0.7" />

          {/* Rear Red LED Brake Lights */}
          <rect x="5.5" y="65.5" width="3.5" height="1.8" rx="0.8" fill="#ef4444" />
          <rect x="27" y="65.5" width="3.5" height="1.8" rx="0.8" fill="#ef4444" />
        </svg>
      </div>
    </div>
  );
}

export default function LiveTracking() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusReg, setSelectedBusReg] = useState(null);
  const selectedBusRegRef = useRef(null);

  const setSelectedBus = useCallback((b) => {
    const reg = typeof b === 'string' ? b : (b?.registration_number || b?.bus_id || null);
    setSelectedBusReg(reg);
    selectedBusRegRef.current = reg;
  }, []);

  const selectedBus = useMemo(() => {
    if (!selectedBusReg) return null;
    return buses.find((b) => b.registration_number === selectedBusReg || b.bus_id === selectedBusReg) || null;
  }, [buses, selectedBusReg]);

  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'campus' | 'moving' | 'online'
  const [showSimModal, setShowSimModal] = useState(false);
  const [customPacket, setCustomPacket] = useState(SAMPLE_VENDOR_PACKETS[3].packet);
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Google Maps Style Live Follow Camera & Route Breadcrumbs
  const [followMode, setFollowMode] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState({});

  // Real-Time GPS Hardware / Provider Telemetry Stream State
  const [isSseActive, setIsSseActive] = useState(false);
  const [latestProviderPacket, setLatestProviderPacket] = useState(null);
  const [isProviderStreamSimActive, setIsProviderStreamSimActive] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const providerStreamTimerRef = useRef(null);
  const providerStepRef = useRef(0);
  const activeAnimationsRef = useRef({});

  // College Campus Geofence State
  const [showGeofence, setShowGeofence] = useState(true);
  const [selectedCampusIndex, setSelectedCampusIndex] = useState(0);
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(1.5);

  const toast = useToast();
  const mapRef = useRef(null);

  const activeCampus = COLLEGE_CAMPUSES[selectedCampusIndex] || COLLEGE_CAMPUSES[0];

  // Generate GeoJSON Polygon for the circular campus radius
  const campusRadiusGeoJSON = useMemo(() => {
    return createGeoJSONCircle(activeCampus.center, geofenceRadiusKm, 64);
  }, [activeCampus, geofenceRadiusKm]);

  // Selected bus breadcrumb trail coordinates: [[lng, lat], ...]
  const selectedTrail = useMemo(() => {
    if (!selectedBus) return [];
    const key = selectedBus.bus_id || selectedBus.gps_device_id;
    return breadcrumbs[key] || [];
  }, [selectedBus, breadcrumbs]);

  // Smoothly runs/glides the bus across the road to the new coordinates reported by the provider
  const animateBusToProviderLocation = useCallback((incomingBus) => {
    const reg = incomingBus.registration_number;
    if (!reg || !incomingBus.latitude || !incomingBus.longitude) return;

    const targetLat = Number(incomingBus.latitude);
    const targetLng = Number(incomingBus.longitude);

    setBuses((prevBuses) => {
      const idx = prevBuses.findIndex(
        (b) => b.registration_number === reg || (b.gps_device_id && b.gps_device_id === incomingBus.imei)
      );

      if (idx === -1) {
        return [{ ...incomingBus, latitude: targetLat, longitude: targetLng }, ...prevBuses];
      }

      const currentBus = prevBuses[idx];
      const startLat = Number(currentBus.latitude) || targetLat;
      const startLng = Number(currentBus.longitude) || targetLng;

      // Small delta check: if coordinates haven't moved noticeably, just update telemetry metadata
      if (Math.abs(startLat - targetLat) < 0.00002 && Math.abs(startLng - targetLng) < 0.00002) {
        const next = [...prevBuses];
        next[idx] = { ...currentBus, ...incomingBus, latitude: targetLat, longitude: targetLng };
        return next;
      }

      // Calculate direction bearing angle towards incoming point
      const bearing = calculateBearing(startLat, startLng, targetLat, targetLng);

      // Cancel previous frame animation for this bus if still running
      if (activeAnimationsRef.current[reg]) {
        cancelAnimationFrame(activeAnimationsRef.current[reg]);
      }

      const startTime = performance.now();
      const duration = 1600; // 1.6s smooth transition matching provider ping interval

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

        const curLat = startLat + (targetLat - startLat) * ease;
        const curLng = startLng + (targetLng - startLng) * ease;

        setBuses((liveBuses) => {
          const lIdx = liveBuses.findIndex((b) => b.registration_number === reg);
          if (lIdx === -1) return liveBuses;
          const updated = [...liveBuses];
          updated[lIdx] = {
            ...updated[lIdx],
            ...incomingBus,
            latitude: curLat,
            longitude: curLng,
            bearing,
            speed_km: incomingBus.speed_km !== undefined ? incomingBus.speed_km : updated[lIdx].speed_km,
            is_online: true,
          };
          return updated;
        });

        // Pan camera if following this bus
        if (selectedBusRegRef.current === reg && followMode && mapRef.current) {
          mapRef.current.easeTo({
            center: [curLng, curLat],
            duration: 80,
          });
        }

        if (progress < 1) {
          activeAnimationsRef.current[reg] = requestAnimationFrame(step);
        } else {
          delete activeAnimationsRef.current[reg];
          setBreadcrumbs((prev) => {
            const list = prev[reg] || [];
            return {
              ...prev,
              [reg]: [...list, [targetLng, targetLat]].slice(-50),
            };
          });
        }
      };

      activeAnimationsRef.current[reg] = requestAnimationFrame(step);
      return prevBuses;
    });
  }, [followMode]);

  // Real-time Provider Telemetry Stream (Server-Sent Events)
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/gps/stream');

      eventSource.onopen = () => {
        setIsSseActive(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'telemetry' && payload.bus) {
            setLatestProviderPacket({
              reg: payload.bus.registration_number,
              speed: payload.bus.speed_km,
              time: new Date().toLocaleTimeString(),
              lat: payload.bus.latitude,
              lng: payload.bus.longitude,
            });
            // Immediately run the bus across the road to the new provider coordinates!
            animateBusToProviderLocation(payload.bus);
          }
        } catch (err) {}
      };

      eventSource.onerror = () => {
        setIsSseActive(false);
      };
    } catch (e) {
      console.warn('SSE error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
      Object.values(activeAnimationsRef.current).forEach((id) => cancelAnimationFrame(id));
    };
  }, [animateBusToProviderLocation]);

  // Stream live provider telemetry packets to /api/gps/raw to test real provider data feed
  const toggleProviderStreamSimulation = () => {
    if (isProviderStreamSimActive) {
      clearInterval(providerStreamTimerRef.current);
      setIsProviderStreamSimActive(false);
      toast('⏸️ Live Provider Feed Stream paused');
    } else {
      setIsProviderStreamSimActive(true);
      toast('📡 Provider Telemetry Feed Started — Sending live packets to /api/gps/raw...');

      // Send telemetry packet every 1.5s as if coming from real GPS provider hardware
      providerStreamTimerRef.current = setInterval(async () => {
        providerStepRef.current++;
        const step = providerStepRef.current;
        const fleetBuses = ['TML6823', 'TN60A2727', 'TN39X4444', 'TN60AB9597', 'TN60K2916'];

        for (const reg of fleetBuses) {
          const route = FLEET_ROAD_ROUTES[reg];
          if (!route) continue;
          const coords = route.coordinates;
          const idx = step % coords.length;
          const [lng, lat] = coords[idx];
          const speed = idx === coords.length - 1 ? 0 : Math.floor(36 + Math.random() * 18);

          try {
            await fetch('/api/gps/raw', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registration_number: reg,
                latitude: lat,
                longitude: lng,
                speed_km: speed,
                ignition: true,
                recorded_at: new Date().toISOString(),
              }),
            });
          } catch (e) {}
        }
      }, 1500);
    }
  };

  // Fetch live locations (initial load + fallback polling)
  const fetchLocations = async () => {
    try {
      const res = await api.gpsLive();
      if (res && res.items) {
        // Strict deduplication by bus_id / registration_number to ensure 100% unique keys
        const seenKeys = new Set();
        const uniqueItems = [];
        for (const item of res.items) {
          const uKey = item.bus_id ? `bus-${item.bus_id}` : (item.registration_number ? `reg-${item.registration_number}` : (item.gps_device_id || Math.random()));
          if (!seenKeys.has(uKey)) {
            seenKeys.add(uKey);
            uniqueItems.push(item);
          }
        }

        setBuses((prevBuses) => {
          if (!prevBuses || prevBuses.length === 0) {
            return uniqueItems;
          }
          // Smoothly glide buses whose provider coordinates changed
          uniqueItems.forEach((inBus) => {
            if (inBus.latitude && inBus.longitude) {
              const existing = prevBuses.find((b) => b.registration_number === inBus.registration_number || (b.bus_id && b.bus_id === inBus.bus_id));
              if (existing && existing.latitude && existing.longitude) {
                const diff = Math.abs(Number(existing.latitude) - Number(inBus.latitude)) +
                             Math.abs(Number(existing.longitude) - Number(inBus.longitude));
                if (diff > 0.0001 && !activeAnimationsRef.current[inBus.registration_number]) {
                  animateBusToProviderLocation(inBus);
                }
              }
            }
          });
          return uniqueItems;
        });

        // Update real-time breadcrumbs for trail rendering
        setBreadcrumbs((prev) => {
          const next = { ...prev };
          uniqueItems.forEach((b) => {
            if (b.latitude && b.longitude) {
              const key = b.bus_id || b.gps_device_id;
              const pt = [Number(b.longitude), Number(b.latitude)];
              const curList = next[key] || [];
              const lastPt = curList[curList.length - 1];
              if (!lastPt || Math.abs(lastPt[0] - pt[0]) > 0.00001 || Math.abs(lastPt[1] - pt[1]) > 0.00001) {
                next[key] = [...curList.slice(-40), pt];
              }
            }
          });
          return next;
        });

        // If a bus is selected and followMode is enabled, keep map camera smoothly tracking it like Google Maps
        if (selectedBusRegRef.current && followMode && mapRef.current) {
          const reg = selectedBusRegRef.current;
          const updated = res.items.find(
            (item) => item.registration_number === reg || item.bus_id === reg || item.gps_device_id === reg
          );
          if (updated && updated.latitude && updated.longitude) {
            mapRef.current.easeTo({
              center: [Number(updated.longitude), Number(updated.latitude)],
              duration: 1000,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Live location poll error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const timer = setInterval(() => {
      if (autoRefresh) fetchLocations();
    }, 4000);
    return () => clearInterval(timer);
  }, [autoRefresh, followMode]);

  // Focus map on bus
  const handleSelectBus = (b) => {
    setSelectedBus(b);
    setFollowMode(true);
    if (b.latitude && b.longitude && mapRef.current) {
      mapRef.current.flyTo({
        center: [Number(b.longitude), Number(b.latitude)],
        zoom: 15,
        duration: 1200,
      });
    }
  };

  // Fly to college campus
  const handleFlyToCampus = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: activeCampus.center,
        zoom: 13.5,
        duration: 1200,
      });
    }
  };

  // Fit map view to whole Theni district (showing all 5 routes)
  const handleDistrictOverview = () => {
    setSelectedBus(null);
    setFollowMode(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [77.4950, 10.0350],
        zoom: 11.8,
        duration: 1200,
      });
    }
  };

  // Test GPS Simulator Submit (accepts optional packet string for 1-click test)
  const handleSendTestPacket = async (packetOverride) => {
    const rawPacket = (typeof packetOverride === 'string' ? packetOverride : customPacket).trim();
    if (!rawPacket) {
      toast('Please enter a GPS packet string');
      return;
    }
    if (packetOverride && typeof packetOverride === 'string') {
      setCustomPacket(packetOverride);
    }
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await api.gpsRaw(rawPacket);
      setSimResult(res);
      toast('✅ GPS Telemetry processed! Map updated.');
      await fetchLocations();

      // If telemetry matched a bus, fly map to it
      if (res?.parsed?.latitude && res?.parsed?.longitude) {
        mapRef.current?.flyTo({
          center: [res.parsed.longitude, res.parsed.latitude],
          zoom: 14,
          duration: 1200,
        });
      }
    } catch (err) {
      setSimResult({ error: err.message });
      toast('Error sending packet: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };


  // Live Driving Simulation State (Moves all fleet buses along their authentic road routes)
  const [isDriveSimActive, setIsDriveSimActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const driveTimerRef = useRef(null);

  // Toggle or start multi-bus fleet driving simulation
  const toggleDriveSimulation = () => {
    if (isDriveSimActive) {
      clearInterval(driveTimerRef.current);
      setIsDriveSimActive(false);
      toast('⏸️ Live Fleet Movement Paused');
    } else {
      setIsDriveSimActive(true);
      setCurrentStepIndex(0);
      setFollowMode(false); // District overview by default so all 5 buses can be seen

      // Reset breadcrumbs for all 5 route buses to their origin points
      const initialBreadcrumbs = {};
      Object.entries(FLEET_ROAD_ROUTES).forEach(([reg, route]) => {
        initialBreadcrumbs[reg] = [route.coordinates[0]];
      });
      setBreadcrumbs(initialBreadcrumbs);

      // Fit map view to cover all routes across Theni district
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [77.4950, 10.0350],
          zoom: 12.2,
          duration: 1200,
        });
      }
      toast('▶️ Started Multi-Bus Fleet Trip! 5 College buses driving on their routes to Campus...');
    }
  };

  useEffect(() => {
    if (!isDriveSimActive) {
      clearInterval(driveTimerRef.current);
      return;
    }

    let step = currentStepIndex;
    const TOTAL_SIM_STEPS = 160;

    const runStep = async () => {
      if (step >= TOTAL_SIM_STEPS) {
        setIsDriveSimActive(false);
        toast('🎉 All 5 fleet buses have arrived and parked at Nadar Saraswathi Campus!');
        return;
      }

      // Calculate new road positions for all 5 fleet buses
      const updatedMap = {};
      Object.entries(FLEET_ROAD_ROUTES).forEach(([reg, route]) => {
        const coords = route.coordinates;
        const idx = Math.min(Math.floor((step / TOTAL_SIM_STEPS) * coords.length), coords.length - 1);
        const nextIdx = Math.min(idx + 1, coords.length - 1);
        const [lng, lat] = coords[idx];
        const [nextLng, nextLat] = coords[nextIdx];
        const bearing = calculateBearing(lat, lng, nextLat, nextLng);
        const speed = getSpeedForRoadStep(idx, coords.length);

        updatedMap[reg] = {
          latitude: lat,
          longitude: lng,
          speed_km: speed,
          bearing: Math.round(bearing),
          ignition: speed > 0,
          is_online: true,
          recorded_at: new Date().toISOString(),
          route_code: route.routeCode,
          route_name: route.routeName,
          driver_name: route.driverName,
          driver_phone: route.driverPhone,
          institution_name: route.institution,
        };
      });

      // Update state for all buses simultaneously
      setBuses((prev) =>
        prev.map((b) => {
          const u = updatedMap[b.registration_number];
          if (u) {
            return { ...b, ...u };
          }
          return b;
        })
      );

      // Add to breadcrumb trail along exact road pavement for each bus
      setBreadcrumbs((prev) => {
        const nextBc = { ...prev };
        Object.entries(updatedMap).forEach(([reg, u]) => {
          const cur = nextBc[reg] || [];
          nextBc[reg] = [...cur, [u.longitude, u.latitude]];
        });
        return nextBc;
      });

      // Smooth camera follow if a specific bus is selected and followMode is ON
      if (selectedBusRegRef.current && mapRef.current && followMode) {
        const target = updatedMap[selectedBusRegRef.current];
        if (target) {
          mapRef.current.easeTo({
            center: [target.longitude, target.latitude],
            duration: 380,
          });
        }
      }

      // Telemetry packet sent to backend periodically
      if (step % 5 === 0) {
        const tml = updatedMap['TML6823'];
        if (tml) {
          const latDeg = Math.floor(tml.latitude);
          const latMin = ((tml.latitude - latDeg) * 60).toFixed(4);
          const rawLat = `${String(latDeg).padStart(2, '0')}${String(latMin).padStart(7, '0')}`;
          const lngDeg = Math.floor(tml.longitude);
          const lngMin = ((tml.longitude - lngDeg) * 60).toFixed(4);
          const rawLng = `${String(lngDeg).padStart(3, '0')}${String(lngMin).padStart(7, '0')}`;
          const speedKnots = (tml.speed_km / 1.852).toFixed(2);
          const timeStr = new Date().toISOString().substring(11, 19).replace(/:/g, '');
          const pkt = `@@863071010318308,,,${timeStr},${rawLat},N,${rawLng},E,${speedKnots},191026,A,0101,1,0,0000,0000,#`;
          api.gpsRaw(pkt).catch(() => {});
        }
      }

      step++;
      setCurrentStepIndex(step);
    };

    runStep();
    driveTimerRef.current = setInterval(runStep, 400);

    return () => clearInterval(driveTimerRef.current);
  }, [isDriveSimActive, followMode]);

  // Fleet buses inside the college radius
  const busesInCampus = useMemo(() => {
    return buses.filter((b) => {
      if (!b.latitude || !b.longitude) return false;
      const dist = calculateDistanceKm(
        b.latitude,
        b.longitude,
        activeCampus.center[1],
        activeCampus.center[0]
      );
      return dist !== null && dist <= geofenceRadiusKm;
    });
  }, [buses, activeCampus, geofenceRadiusKm]);

  // Filtered buses list
  const filteredBuses = useMemo(() => {
    return buses.filter((b) => {
      const q = filterQuery.toLowerCase();
      const matchSearch =
        !q ||
        (b.registration_number && b.registration_number.toLowerCase().includes(q)) ||
        (b.route_code && b.route_code.toLowerCase().includes(q)) ||
        (b.driver_name && b.driver_name.toLowerCase().includes(q)) ||
        (b.gps_device_id && b.gps_device_id.includes(q));

      const isMoving = Number(b.speed_km || 0) > 1;
      let matchStatus = true;
      if (statusFilter === 'moving') matchStatus = isMoving;
      if (statusFilter === 'stationary') matchStatus = !isMoving && Boolean(b.latitude);
      if (statusFilter === 'online') matchStatus = b.is_online;
      if (statusFilter === 'campus') {
        const dist = calculateDistanceKm(
          b.latitude,
          b.longitude,
          activeCampus.center[1],
          activeCampus.center[0]
        );
        matchStatus = dist !== null && dist <= geofenceRadiusKm;
      }

      return matchSearch && matchStatus;
    });
  }, [buses, filterQuery, statusFilter, activeCampus, geofenceRadiusKm]);

  const movingCount = buses.filter((b) => Number(b.speed_km || 0) > 1).length;
  const onlineCount = buses.filter((b) => b.is_online).length;

  return (
    <div className="live-gps-page" style={{ padding: '24px 32px 32px', background: '#f4f6fa', minHeight: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Top Banner & Control Bar */}
      <div className="live-gps-header-card" style={{ background: '#ffffff', borderRadius: 18, padding: '18px 24px', border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 4px 20px -2px rgba(115, 103, 240, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c6cfc 0%, #6854ec 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(124, 108, 252, 0.35)', flexShrink: 0 }}>
            <Radio style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <span>Live Fleet GPS Tracking</span>
              <span className="live-gps-tcp-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                <span className="beacon-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                TCP Port: 5050 Active
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
              Real-time telemetry parsed from bus GPS trackers &bull; <b>{buses.length}</b> Fleet Vehicles &bull; College Campus Radius Geofence Active
            </p>
          </div>
        </div>

        {/* Action Controls & Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6854ec' }}>
              <span>🏛️ <b>{busesInCampus.length}</b> at College</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span><b>{movingCount}</b> Moving</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
              <span><b>{onlineCount}</b> Online</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn btn-sm ${autoRefresh ? 'btn-secondary' : 'btn-outline'}`}
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={autoRefresh ? 'Auto-refresh every 5s is ON' : 'Auto-refresh is PAUSED'}
          >
            <RefreshCw style={{ width: 14, height: 14 }} className={autoRefresh ? 'animate-spin' : ''} />
            <span>{autoRefresh ? 'Auto (5s)' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={toggleDriveSimulation}
            className="btn btn-sm"
            style={{
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: isDriveSimActive ? '#fef2f2' : '#ecfdf5',
              color: isDriveSimActive ? '#dc2626' : '#047857',
              border: isDriveSimActive ? '1.5px solid #f87171' : '1.5px solid #34d399',
              padding: '7px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: isDriveSimActive ? '0 0 14px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.2s ease',
            }}
            title="Watch the bus physically drive along the highway into the college campus in real time"
          >
            {isDriveSimActive ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'beaconFlash 1s infinite' }} />
                <span>⏹️ Stop Movement</span>
              </>
            ) : (
              <>
                <Play style={{ width: 14, height: 14, color: '#059669', fill: '#059669' }} />
                <span>▶️ Live Bus Movement</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSendTestPacket(SAMPLE_VENDOR_PACKETS[3].packet)}
            disabled={isSimulating || isDriveSimActive}
            className="btn btn-sm"
            style={{
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f5f3ff',
              color: '#6854ec',
              border: '1.5px solid #c4b5fd',
              padding: '7px 12px',
              borderRadius: 10,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
            }}
            title="1-Click simulate telemetry for bus inside Vadapudupatti College Campus"
          >
            <Zap style={{ width: 14, height: 14, color: '#7c6cfc' }} />
            <span>{isSimulating ? 'Simulating...' : '⚡ 1-Click Test (Campus Arrival)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSimModal(true)}
            className="btn btn-sm btn-primary"
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Send style={{ width: 14, height: 14 }} />
            <span>Test GPS Packet Simulator</span>
          </button>

          <Link
            to="/admin/gps-explainer"
            className="btn btn-sm"
            style={{
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#312e81',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(49, 46, 129, 0.2)',
            }}
            title="Open interactive GPS architecture & protocol explainer for your tutor"
          >
            <span>🎓</span>
            <span>Tutor Explainer</span>
          </Link>
        </div>
      </div>

      {/* Live Provider Telemetry Streaming Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isSseActive ? 'linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%)' : '#f8fafc',
          border: `1px solid ${isSseActive ? '#a7f3d0' : '#e2e8f0'}`,
          borderRadius: 12,
          padding: '8px 16px',
          marginBottom: 14,
          fontSize: 12.5,
          color: '#1e293b',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: isSseActive ? '#10b981' : '#94a3b8',
                boxShadow: isSseActive ? '0 0 0 3px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            />
            <span style={{ color: isSseActive ? '#065f46' : '#64748b' }}>
              {isSseActive ? 'LIVE PROVIDER STREAM ACTIVE' : 'PROVIDER STREAM CONNECTING...'}
            </span>
          </div>

          <span style={{ color: '#cbd5e1' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 12 }}>
            <span>📡 TCP Socket: <code style={{ background: '#ffffff', padding: '2px 5px', borderRadius: 4, border: '1px solid #e2e8f0', fontWeight: 700 }}>Port 5050</code></span>
            <span>🌐 Webhook: <code style={{ background: '#ffffff', padding: '2px 5px', borderRadius: 4, border: '1px solid #e2e8f0', fontWeight: 700 }}>/api/gps/raw</code></span>
          </div>

          {latestProviderPacket && (
            <>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600 }}>
                <span>⚡ Incoming Provider Ping:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{latestProviderPacket.reg}</span>
                <span>({latestProviderPacket.speed} km/h)</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>at {latestProviderPacket.time}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={toggleProviderStreamSimulation}
            style={{
              background: isProviderStreamSimActive ? '#dc2626' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease',
            }}
            title="Streams live simulated provider packets to backend /api/gps/raw so you can verify the bus running on incoming provider data!"
          >
            <Activity style={{ width: 13, height: 13 }} />
            <span>{isProviderStreamSimActive ? '⏹️ Stop Provider Feed' : '📡 Stream Provider Feed'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHardwareModal(true)}
            style={{
              background: '#ffffff',
              color: '#4f46e5',
              border: '1px solid #c7d2fe',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="View GPS hardware tracker setup instructions and webhook specifications"
          >
            <Settings style={{ width: 13, height: 13 }} />
            <span>Hardware Setup</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Bus Sidebar (Left) + Interactive Map (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, height: 'calc(100vh - 200px)', minHeight: 560 }}>
        {/* Left Bus Directory */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 4px 20px -2px rgba(115, 103, 240, 0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {/* Search & Tabs */}
          <div style={{ padding: 16, background: '#ffffff', borderBottom: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <Compass style={{ position: 'absolute', left: 12, width: 16, height: 16, color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search bus number, route, driver, IMEI..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              {[
                { key: 'all', label: `All (${buses.length})` },
                { key: 'campus', label: `At Clg (${busesInCampus.length})` },
                { key: 'moving', label: `Moving (${movingCount})` },
                { key: 'online', label: `Online (${onlineCount})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    border: 'none',
                    background: statusFilter === tab.key ? '#ffffff' : 'transparent',
                    color: statusFilter === tab.key ? '#6854ec' : '#64748b',
                    padding: '7px 2px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 8,
                    cursor: 'pointer',
                    boxShadow: statusFilter === tab.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    textAlign: 'center',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Bus Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredBuses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                No fleet buses match your filter.
              </div>
            ) : (
              filteredBuses.map((b, idx) => {
                const isSelected = (selectedBus?.registration_number && selectedBus.registration_number === b.registration_number) || (selectedBus?.bus_id && selectedBus.bus_id === b.bus_id);
                const hasGps = Boolean(b.latitude && b.longitude);
                const isMoving = Number(b.speed_km || 0) > 1;
                const distToCampus = calculateDistanceKm(
                  b.latitude,
                  b.longitude,
                  activeCampus.center[1],
                  activeCampus.center[0]
                );
                const isInsideCampus = distToCampus !== null && distToCampus <= geofenceRadiusKm;

                return (
                  <div
                    key={b.bus_id ? `fleet-bus-${b.bus_id}` : (b.registration_number ? `fleet-reg-${b.registration_number}` : `fleet-idx-${idx}`)}
                    onClick={() => (isSelected ? setSelectedBus(null) : handleSelectBus(b))}
                    style={{
                      background: isSelected ? '#fbfaff' : '#ffffff',
                      border: isSelected ? '1.5px solid #7c6cfc' : '1.5px solid #edf2f7',
                      boxShadow: isSelected ? '0 0 0 2px rgba(124, 108, 252, 0.2), 0 6px 16px rgba(124, 108, 252, 0.08)' : 'none',
                      borderRadius: 14,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1e293b', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            background: FLEET_ROAD_ROUTES[b.registration_number]?.color || '#94a3b8',
                            display: 'inline-block',
                          }}
                        />
                        <span>🚌</span>
                        <span>{b.registration_number}</span>
                      </div>
                      {hasGps ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isInsideCampus && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 6px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 800,
                                background: '#ede9fe',
                                color: '#6854ec',
                                border: '1px solid #ddd6fe'
                              }}
                              title="Inside College Radius"
                            >
                              🏛️ At Clg
                            </span>
                          )}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 8px',
                              borderRadius: 8,
                              fontSize: 10.5,
                              fontWeight: 700,
                              letterSpacing: '0.2px',
                              background: isMoving ? '#ecfdf5' : '#fefce8',
                              color: isMoving ? '#047857' : '#a16207',
                              border: `1px solid ${isMoving ? '#a7f3d0' : '#fef08a'}`
                            }}
                          >
                            {isMoving ? `🚗 ${b.speed_km} km/h` : '🅿️ Idle'}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 8,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: '#f8fafc',
                            color: '#94a3b8',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          No GPS Fix
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Route:</span>
                        <span style={{ fontWeight: 700, color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.route_code || 'Unassigned'} {b.route_name && b.route_name !== '—' ? `(${b.route_name})` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Driver:</span>
                        <span style={{ fontWeight: 700, color: '#334155' }}>
                          {b.driver_name || '—'}
                        </span>
                      </div>

                      {hasGps && distToCampus !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Campus Distance:</span>
                          <span style={{
                            fontWeight: 700,
                            fontSize: 11,
                            color: isInsideCampus ? '#059669' : '#475569',
                            background: isInsideCampus ? '#ecfdf5' : '#f8fafc',
                            padding: '1px 6px',
                            borderRadius: 6,
                            border: `1px solid ${isInsideCampus ? '#a7f3d0' : '#e2e8f0'}`
                          }}>
                            {isInsideCampus ? `🎯 At Campus (${distToCampus} km)` : `📍 ${distToCampus} km away`}
                          </span>
                        </div>
                      )}

                      {hasGps && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Ignition:</span>
                          <span style={{ fontWeight: 700, fontSize: 11, color: b.ignition ? '#059669' : '#64748b' }}>
                            {b.ignition ? '🔥 ON' : '⚪ OFF'}
                          </span>
                        </div>
                      )}

                      {b.gps_device_id && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2, fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }}>
                          <span>IMEI: {b.gps_device_id}</span>
                          {b.recorded_at && (
                            <span>
                              {new Date(b.recorded_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Map Canvas powered by @mapcn/map with MapGeoJSON */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 4px 20px -2px rgba(115, 103, 240, 0.05)', overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Floating Campus Radius Control Bar */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '7px 12px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.1)',
              flexWrap: 'wrap',
              maxWidth: 'calc(100% - 28px)',
            }}
          >
            {/* Toggle Geofence ON/OFF */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={showGeofence}
                onChange={(e) => setShowGeofence(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#6854ec', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 800, fontSize: 12.5, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🏛️</span>
                <span>College Radius:</span>
              </span>
            </label>

            {/* Campus Selector */}
            <select
              value={selectedCampusIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedCampusIndex(idx);
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: COLLEGE_CAMPUSES[idx].center,
                    zoom: 13,
                    duration: 1000,
                  });
                }
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {COLLEGE_CAMPUSES.map((c, i) => (
                <option key={c.id} value={i}>
                  {c.shortName}
                </option>
              ))}
            </select>

            {/* Radius Selector Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f1f5f9', padding: '2px 4px', borderRadius: 8 }}>
              {[0.5, 1.0, 1.5, 2.5, 5.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGeofenceRadiusKm(r)}
                  style={{
                    border: 'none',
                    background: geofenceRadiusKm === r ? '#6854ec' : 'transparent',
                    color: geofenceRadiusKm === r ? '#ffffff' : '#64748b',
                    padding: '3px 7px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}km
                </button>
              ))}
            </div>

            {/* Fly to Campus Button */}
            <button
              type="button"
              onClick={handleFlyToCampus}
              style={{
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#4f46e5',
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Center map on college campus"
            >
              <span>🎯</span>
              <span>Center</span>
            </button>

            {/* District Fleet View Button */}
            <button
              type="button"
              onClick={handleDistrictOverview}
              style={{
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#6854ec',
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="View all 5 college routes across Theni district"
            >
              <span>🗺️</span>
              <span>All Routes</span>
            </button>

            {/* Buses In Campus Pill */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: busesInCampus.length > 0 ? '#ecfdf5' : '#f8fafc',
                color: busesInCampus.length > 0 ? '#047857' : '#64748b',
                padding: '3px 8px',
                borderRadius: 8,
                border: `1px solid ${busesInCampus.length > 0 ? '#a7f3d0' : '#e2e8f0'}`,
              }}
            >
              {busesInCampus.length} in campus
            </span>
          </div>

          <Map
            ref={mapRef}
            center={activeCampus.center} // Default centered on Nadar Saraswathi College Campus
            zoom={12}
            className="h-full w-full"
          >
            <MapControls position="bottom-right" />

            {/* College Campus Radius Overlay using MapGeoJSON */}
            {showGeofence && (
              <MapGeoJSON
                id={`college-radius-${activeCampus.id}`}
                data={campusRadiusGeoJSON}
                fillPaint={{
                  'fill-color': '#7c6cfc',
                  'fill-opacity': 0.22,
                }}
                linePaint={{
                  'line-color': '#4f46e5',
                  'line-width': 2.5,
                  'line-dasharray': [3, 2],
                }}
              />
            )}

            {/* College Campus Center Marker */}
            <MapMarker
              longitude={activeCampus.center[0]}
              latitude={activeCampus.center[1]}
            >
              <MarkerContent>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#ffffff',
                    border: '2px solid #6854ec',
                    borderRadius: 20,
                    padding: '5px 10px',
                    boxShadow: '0 4px 16px rgba(104, 84, 236, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🏛️</span>
                  <span style={{ fontWeight: 800, fontSize: 11, color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {activeCampus.shortName}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      background: '#ede9fe',
                      color: '#6854ec',
                      padding: '1px 6px',
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    {geofenceRadiusKm} km
                  </span>
                </div>
              </MarkerContent>

              <MarkerPopup>
                <div style={{ minWidth: 240, padding: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1e293b', marginBottom: 2 }}>
                    🏛️ {activeCampus.name}
                  </div>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 8px' }}>
                    {activeCampus.institutions}
                  </p>
                  <div style={{ fontSize: 11, background: '#f8fafc', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Active Geofence:</span>
                      <b>{geofenceRadiusKm} km Radius</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Fleet Inside Radius:</span>
                      <b style={{ color: '#059669' }}>{busesInCampus.length} buses arrived</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>
                      <span>Coordinates:</span>
                      <span>{activeCampus.center[1]}°N, {activeCampus.center[0]}°E</span>
                    </div>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>

            {/* Render MapMarker for every bus with coordinates */}
            {buses
              .filter((b) => b.latitude && b.longitude)
              .map((b, idx) => {
                const isSelected = (selectedBus?.registration_number && selectedBus.registration_number === b.registration_number) || (selectedBus?.bus_id && selectedBus.bus_id === b.bus_id);
                const isMoving = Number(b.speed_km || 0) > 1;
                const distToCampus = calculateDistanceKm(
                  b.latitude,
                  b.longitude,
                  activeCampus.center[1],
                  activeCampus.center[0]
                );
                const isInsideCampus = distToCampus !== null && distToCampus <= geofenceRadiusKm;
                const routeInfo = FLEET_ROAD_ROUTES[b.registration_number];
                const pinColor = isInsideCampus
                  ? '#6854ec'
                  : (routeInfo?.color || (isMoving ? '#10b981' : '#64748b'));

                return (
                  <MapMarker
                    key={b.bus_id ? `marker-bus-${b.bus_id}` : (b.registration_number ? `marker-reg-${b.registration_number}` : `marker-idx-${idx}`)}
                    longitude={Number(b.longitude)}
                    latitude={Number(b.latitude)}
                    onClick={() => (isSelected ? setSelectedBus(null) : setSelectedBus(b))}
                  >
                    <MarkerContent>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
                        {/* Speed badge floating on top of moving vehicle */}
                        {isMoving && (
                          <div
                            style={{
                              background: 'rgba(15, 23, 42, 0.92)',
                              color: '#34d399',
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 8,
                              marginBottom: 3,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              whiteSpace: 'nowrap',
                              border: '1px solid rgba(52, 211, 153, 0.35)',
                              pointerEvents: 'none',
                            }}
                          >
                            {b.speed_km} km/h
                          </div>
                        )}

                        {/* Realistic 3D/Top-Down Bus Vehicle Object */}
                        <BusVehicleObject
                          color={pinColor}
                          bearing={b.bearing || 0}
                          isSelected={isSelected}
                          isMoving={isMoving}
                          isInsideCampus={isInsideCampus}
                          registration={b.registration_number}
                        />

                        {/* Bus Registration Tag */}
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            background: '#ffffff',
                            color: '#1e293b',
                            padding: '1px 5px',
                            borderRadius: 6,
                            marginTop: 3,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            border: `1.5px solid ${pinColor}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.registration_number}
                        </div>
                      </div>
                    </MarkerContent>

                    {/* Pop-up on marker click */}
                    <MarkerPopup>
                      <div style={{ minWidth: 230, padding: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', fontFamily: 'monospace' }}>
                            {b.registration_number}
                          </span>
                          <span
                            style={{
                              background: isMoving ? '#ecfdf5' : '#f1f5f9',
                              color: isMoving ? '#047857' : '#475569',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            {isMoving ? `🚗 ${b.speed_km} km/h` : 'Stopped'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#334155' }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Campus Proximity:</span>{' '}
                            <b style={{ color: isInsideCampus ? '#059669' : '#334155' }}>
                              {isInsideCampus ? `🎯 Inside Campus (${distToCampus} km)` : `📍 ${distToCampus} km away`}
                            </b>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Route:</span>{' '}
                            <b>{b.route_code || '—'}</b> {b.route_name && b.route_name !== '—' ? `(${b.route_name})` : ''}
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Driver:</span>{' '}
                            <b>{b.driver_name || '—'}</b>
                            {b.driver_phone && (
                              <a
                                href={`tel:${b.driver_phone}`}
                                style={{ marginLeft: 8, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                              >
                                📞 {b.driver_phone}
                              </a>
                            )}
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Ignition:</span>{' '}
                            <b style={{ color: b.ignition ? '#059669' : '#94a3b8' }}>
                              {b.ignition ? '🔥 ON' : '⚪ OFF'}
                            </b>
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>
                            Coords: {Number(b.latitude).toFixed(5)}, {Number(b.longitude).toFixed(5)}
                          </div>
                          {b.recorded_at && (
                            <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }}>
                              Updated: {new Date(b.recorded_at).toLocaleTimeString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                );
              })}

            {/* Highway Route & Live GPS Trail: ONLY shown when a bus is clicked/selected */}
            {selectedBus && (() => {
              const reg = selectedBus.registration_number;
              const route = FLEET_ROAD_ROUTES[reg];
              const busTrail = breadcrumbs[reg] || [];
              const routeColor = route?.color || '#6854ec';

              return (
                <React.Fragment key={reg}>
                  {/* Planned Highway Route Line on physical roads (Only for selected bus) */}
                  {route && route.coordinates && (
                    <MapRoute
                      id={`selected-bus-route-${reg}`}
                      coordinates={route.coordinates}
                      color={routeColor}
                      width={6}
                      opacity={0.85}
                    />
                  )}

                  {/* Live GPS Trail Breadcrumbs for this selected bus */}
                  {busTrail.length >= 2 && (
                    <MapRoute
                      id={`selected-bus-trail-${reg}`}
                      coordinates={busTrail}
                      color="#f59e0b"
                      width={5.5}
                      opacity={0.95}
                    />
                  )}
                </React.Fragment>
              );
            })()}
          </Map>

          {/* Floating Google Maps-Style Live Navigation Card */}
          {selectedBus && selectedBus.latitude && selectedBus.longitude && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                padding: '14px 18px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                border: '1.5px solid #7c6cfc',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: 340,
                maxWidth: 'calc(100% - 36px)',
                animation: 'slideUp 0.2s ease',
              }}
            >
              {/* Top Row: Reg, Live Badge & Close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🚌
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', letterSpacing: '0.2px' }}>
                      {selectedBus.registration_number}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {selectedBus.institution_name ? `${selectedBus.institution_name} • ` : ''}
                      {selectedBus.route_code || 'Unassigned'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#ecfdf5',
                      color: '#059669',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 800,
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    LIVE
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedBus(null);
                      setFollowMode(false);
                    }}
                    style={{
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#64748b',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#64748b';
                    }}
                    title="Close and Deselect Bus"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Telemetry Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: '#f8fafc', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700 }}>SPEED</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: Number(selectedBus.speed_km || 0) > 1 ? '#059669' : '#64748b' }}>
                    {selectedBus.speed_km || 0} km/h
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700 }}>IGNITION</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: selectedBus.ignition ? '#059669' : '#94a3b8' }}>
                    {selectedBus.ignition ? '🔥 ON' : '⚪ OFF'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700 }}>CAMPUS DIST</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#6854ec' }}>
                    {calculateDistanceKm(selectedBus.latitude, selectedBus.longitude, activeCampus.center[1], activeCampus.center[0]) || '—'} km
                  </div>
                </div>
              </div>

              {/* Route & Driver Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Route:</span>
                  <b>{selectedBus.route_name && selectedBus.route_name !== '—' ? `${selectedBus.route_code} (${selectedBus.route_name})` : (selectedBus.route_code || 'Unassigned')}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Driver:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b>{selectedBus.driver_name || 'Unassigned'}</b>
                    {selectedBus.driver_phone && (
                      <a
                        href={`tel:${selectedBus.driver_phone}`}
                        style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', background: '#eff6ff', padding: '1px 5px', borderRadius: 6, fontSize: 10.5 }}
                      >
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Follow Toggle & Open in Google Maps */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                <button
                  type="button"
                  onClick={() => setFollowMode(!followMode)}
                  style={{
                    flex: 1,
                    border: followMode ? '1.5px solid #6854ec' : '1px solid #cbd5e1',
                    background: followMode ? '#ede9fe' : '#ffffff',
                    color: followMode ? '#5b21b6' : '#64748b',
                    padding: '7px 10px',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                  title="When ON, camera automatically locks and tracks the bus as it drives"
                >
                  <Target style={{ width: 13, height: 13, color: followMode ? '#6854ec' : '#94a3b8' }} />
                  <span>{followMode ? '🎯 Following: ON' : 'Lock Camera'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps?q=${selectedBus.latitude},${selectedBus.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#1e293b',
                    padding: '7px 10px',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                  title="Open live coordinate pin directly in Google Maps"
                >
                  <ExternalLink style={{ width: 12, height: 12, color: '#475569' }} />
                  <span>Google Maps ↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Modal */}
      {showSimModal && (
        <div
          className="modal-bg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setShowSimModal(false)}
        >
          <div
            className="modal"
            style={{
              position: 'relative',
              zIndex: 100000,
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🧪</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                    GPS Telemetry Test Simulator
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Test real-time NMEA packet parsing and college campus geofence detection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Test Scenarios */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Select a Test Packet Scenario:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SAMPLE_VENDOR_PACKETS.map((s, idx) => {
                  const isSelected = customPacket === s.packet;
                  return (
                    <div
                      key={idx}
                      onClick={() => setCustomPacket(s.packet)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #7c6cfc' : '1px solid #e2e8f0',
                        background: isSelected ? '#f5f3ff' : '#f8fafc',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 700, color: isSelected ? '#5b21b6' : '#1e293b' }}>
                          {s.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendTestPacket(s.packet);
                            }}
                            disabled={isSimulating}
                            style={{
                              border: 'none',
                              background: '#7c6cfc',
                              color: '#ffffff',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isSimulating ? 'not-allowed' : 'pointer',
                            }}
                          >
                            ⚡ Send This
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#7c6cfc' : '#94a3b8' }}>
                            {isSelected ? '✓ Loaded' : 'Click to load'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {s.desc}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.packet}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packet Input Box */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Raw Packet String (ASCII NMEA):
              </label>
              <textarea
                rows={3}
                value={customPacket}
                onChange={(e) => setCustomPacket(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: '#1e293b',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="@@863071010318308,,,070739,1100.7754,N,07657.7117,E,0.43,210813,A,0101,1,0,0000,0000,#"
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                📡 TCP Port: <b>5050</b> | HTTP: <b>/api/gps/raw</b>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSendTestPacket(customPacket)}
                  disabled={isSimulating}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: isSimulating ? '#94a3b8' : 'linear-gradient(135deg, #7c6cfc 0%, #6854ec 100%)',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(104, 84, 236, 0.35)',
                  }}
                >
                  <Send style={{ width: 14, height: 14 }} />
                  <span>{isSimulating ? 'Sending Packet...' : 'Send Test Packet'}</span>
                </button>
              </div>
            </div>

            {/* Result Display */}
            {simResult && (
              <div
                style={{
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  border: simResult.error ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  background: simResult.error ? '#fef2f2' : '#f0fdf4',
                  color: simResult.error ? '#991b1b' : '#166534',
                }}
              >
                {simResult.error ? (
                  <div>❌ Error: {simResult.error}</div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6, color: '#15803d', fontSize: 13 }}>
                      ✅ Telemetry Successfully Ingested:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      <div>• IMEI: <b>{simResult.parsed?.imei}</b></div>
                      <div>• Latitude: <b>{simResult.parsed?.latitude}° N</b></div>
                      <div>• Longitude: <b>{simResult.parsed?.longitude}° E</b></div>
                      <div>• Speed: <b>{simResult.parsed?.speedKm} km/h</b></div>
                      <div>• Ignition: <b>{simResult.parsed?.ignition ? 'ON' : 'OFF'}</b></div>
                      <div>• Bus: <b>{simResult.telemetry?.registration_number || 'TML6823'}</b></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GPS Hardware Tracker Setup & Provider Integration Modal */}
      {showHardwareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowHardwareModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 680,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server style={{ width: 20, height: 20, color: '#a5b4fc' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>GPS Hardware & Provider Integration</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#c7d2fe' }}>
                    Connect real tracking devices or external GPS provider APIs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, color: '#334155' }}>
              {/* Option 1: Direct Hardware Socket */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                  <Cpu style={{ width: 16, height: 16, color: '#6854ec' }} />
                  <span>Option 1: Direct Physical Tracker (Concox, Teltonika, Coban, Sinotrack)</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                  Configure the SIM card GPS tracker inside the bus to transmit raw telemetry packets directly to your TMS server:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontFamily: 'monospace', fontSize: 12, background: '#ffffff', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <div>Server Host / IP: <b>Your Server IP</b></div>
                  <div>TCP Port: <b style={{ color: '#6854ec' }}>5050</b></div>
                  <div>Protocol: <b>TCP (Socket)</b></div>
                  <div>Format: <b>@@&lt;IMEI&gt;...#</b></div>
                </div>
              </div>

              {/* Option 2: HTTP Webhook / Provider API */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                  <Wifi style={{ width: 16, height: 16, color: '#059669' }} />
                  <span>Option 2: Provider API / Webhook (Traccar, Fleetx, LocoNav, etc.)</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                  If your GPS vendor pushes telemetry via HTTP Webhook, configure them to POST to:
                </p>
                <div style={{ background: '#ffffff', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: 12, color: '#0f172a' }}>
                  <div style={{ fontWeight: 700, color: '#059669', marginBottom: 6 }}>POST http://&lt;YOUR_SERVER&gt;:5001/api/gps/raw</div>
                  <pre style={{ margin: 0, color: '#475569', fontSize: 11.5 }}>
{`// Headers: Content-Type: application/json
{
  "registration_number": "TML6823", // or "imei": "863071010318308"
  "latitude": 10.0250,
  "longitude": 77.4950,
  "speed_km": 48.5,
  "ignition": true
}`}
                  </pre>
                </div>
              </div>

              {/* How it runs live */}
              <div style={{ background: '#ecfdf5', padding: 14, borderRadius: 12, border: '1px solid #a7f3d0', fontSize: 12.5, color: '#065f46' }}>
                <b>⚡ Automatic Road Running:</b> Whenever a GPS coordinate packet hits either TCP Port 5050 or the HTTP Webhook, the backend immediately broadcasts it to this browser screen via Server-Sent Events (SSE). The bus marker on the map smoothly glides across the road to the new coordinates in real time!
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
