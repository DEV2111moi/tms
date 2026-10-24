import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import * as MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, Minus, Plus, Locate, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Setup worker URL if not configured
if (typeof window !== "undefined" && !MapLibreGL.getWorkerUrl()) {
  try {
    MapLibreGL.setWorkerUrl(
      `https://unpkg.com/maplibre-gl@${MapLibreGL.getVersion()}/dist/maplibre-gl-worker.mjs`
    );
  } catch (e) {}
}

const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
};

const blankMapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "rgba(0, 0, 0, 0)" },
    },
  ],
};

function useStableValue(value) {
  const key = useMemo(() => JSON.stringify(value) ?? "", [value]);
  return useMemo(() => value, [key]);
}

function getDocumentTheme() {
  if (typeof document === "undefined") return null;
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  const dataTheme = root.dataset.theme;
  if (dataTheme === "dark" || dataTheme === "light") return dataTheme;
  return null;
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useResolvedTheme(themeProp) {
  const [detectedTheme, setDetectedTheme] = useState(
    () => getDocumentTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    if (themeProp) return;

    const observer = new MutationObserver(() => {
      const docTheme = getDocumentTheme();
      if (docTheme) setDetectedTheme(docTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e) => {
      if (!getDocumentTheme()) {
        setDetectedTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
}

const MapContext = createContext(null);

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

function getViewport(map) {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

export const Map = forwardRef(function Map(
  {
    children,
    className,
    theme: themeProp,
    styles,
    blank = false,
    projection,
    viewport,
    onViewportChange,
    loading = false,
    center = [77.4768, 9.9252], // Default centered on Theni / Tamil Nadu
    zoom = 10,
    ...props
  },
  ref
) {
  const containerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  const stableStyles = useStableValue(styles);

  const mapStyles = useMemo(() => {
    if (stableStyles) {
      return {
        dark: stableStyles.dark ?? defaultStyles.dark,
        light: stableStyles.light ?? defaultStyles.light,
      };
    }
    if (blank) {
      return { dark: blankMapStyle, light: blankMapStyle };
    }
    return defaultStyles;
  }, [stableStyles, blank]);

  useImperativeHandle(ref, () => mapInstance, [mapInstance]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style: initialStyle,
      center,
      zoom,
      attributionControl: { compact: true },
      ...props,
      ...viewport,
    });

    const styleLoadHandler = () => setIsStyleLoaded(true);
    const loadHandler = () => setIsLoaded(true);
    const handleMove = () => onViewportChange?.(getViewport(map));

    map.on("load", loadHandler);
    map.on("style.load", styleLoadHandler);
    map.on("move", handleMove);
    setMapInstance(map);

    return () => {
      map.off("load", loadHandler);
      map.off("style.load", styleLoadHandler);
      map.off("move", handleMove);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
      resolvedTheme,
    }),
    [mapInstance, isLoaded, isStyleLoaded, resolvedTheme]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}
        style={{ minHeight: "450px" }}
      >
        {(!isLoaded || loading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-md">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading Live Map...</span>
            </div>
          </div>
        )}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

// Marker Component
const MarkerContext = createContext(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("Marker components must be used within MapMarker");
  }
  return context;
}

export function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
  draggable = false,
  ...markerOptions
}) {
  const { map } = useMap();

  const marker = useMemo(() => {
    const el = document.createElement("div");
    const markerInstance = new MapLibreGL.Marker({
      ...markerOptions,
      element: el,
      draggable,
    }).setLngLat([longitude, latitude]);

    if (onClick) {
      el.addEventListener("click", onClick);
    }

    return markerInstance;
  }, []);

  useEffect(() => {
    if (!map) return;
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map]);

  useEffect(() => {
    if (longitude != null && latitude != null) {
      const cur = marker.getLngLat();
      if (cur.lng !== longitude || cur.lat !== latitude) {
        marker.setLngLat([longitude, latitude]);
      }
    }
  }, [longitude, latitude, marker]);

  return (
    <MarkerContext.Provider value={{ marker, map }}>
      {children}
    </MarkerContext.Provider>
  );
}

export function MarkerContent({ children, className }) {
  const { marker } = useMarkerContext();
  return createPortal(
    <div className={cn("relative cursor-pointer transition-transform hover:scale-110", className)}>
      {children || <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md" />}
    </div>,
    marker.getElement()
  );
}

export function MarkerPopup({ children, className, closeButton = true, ...popupOptions }) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);

  const popup = useMemo(() => {
    return new MapLibreGL.Popup({
      offset: 16,
      closeButton,
      ...popupOptions,
    }).setDOMContent(container);
  }, []);

  useEffect(() => {
    if (!map) return;
    marker.setPopup(popup);
    return () => {
      marker.setPopup(null);
    };
  }, [map, marker, popup]);

  return createPortal(
    <div
      className={cn("rounded-lg bg-white p-3 text-slate-800 shadow-xl border border-slate-200", className)}
      style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 12,
        color: '#1e293b',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
        border: '1px solid #e2e8f0',
        minWidth: 230,
      }}
    >
      {children}
    </div>,
    container
  );
}

export function MapControls({
  position = "bottom-right",
  showZoom = true,
  showLocate = true,
  showFullscreen = true,
  className,
}) {
  const { map } = useMap();

  const handleZoomIn = () => map?.zoomTo(map.getZoom() + 1, { duration: 250 });
  const handleZoomOut = () => map?.zoomTo(map.getZoom() - 1, { duration: 250 });
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      map?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 14,
        duration: 1200,
      });
    });
  };
  const handleFullscreen = () => {
    const el = map?.getContainer();
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  const posCoordStyles = {
    "top-left": { top: 12, left: 12 },
    "top-right": { top: 12, right: 12 },
    "bottom-left": { bottom: 12, left: 12 },
    "bottom-right": { bottom: 12, right: 12 },
  };

  return (
    <div
      className={cn("absolute z-10 flex flex-col gap-1.5", className)}
      style={{
        position: 'absolute',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        ...(posCoordStyles[position] || posCoordStyles["bottom-right"]),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 10,
          background: '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {showZoom && (
          <>
            <button
              type="button"
              onClick={handleZoomIn}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff',
                cursor: 'pointer',
              }}
              title="Zoom In"
            >
              <Plus style={{ width: 16, height: 16, color: '#334155' }} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: '#ffffff',
                cursor: 'pointer',
              }}
              title="Zoom Out"
            >
              <Minus style={{ width: 16, height: 16, color: '#334155' }} />
            </button>
          </>
        )}
      </div>

      {(showLocate || showFullscreen) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 10,
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {showLocate && (
            <button
              type="button"
              onClick={handleLocate}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderBottom: showFullscreen ? '1px solid #e2e8f0' : 'none',
                background: '#ffffff',
                cursor: 'pointer',
              }}
              title="Find My Location"
            >
              <Locate style={{ width: 16, height: 16, color: '#334155' }} />
            </button>
          )}
          {showFullscreen && (
            <button
              type="button"
              onClick={handleFullscreen}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: '#ffffff',
                cursor: 'pointer',
              }}
              title="Toggle Fullscreen"
            >
              <Maximize style={{ width: 16, height: 16, color: '#334155' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MapRoute({
  id = "route-line",
  coordinates = [],
  color = "#2563eb",
  width = 4,
  opacity = 0.85,
  dashArray = null,
}) {
  const { map, isLoaded } = useMap();
  const sourceId = `source-${id}`;
  const layerId = `layer-${id}`;

  // 1. Initialize source and layer once when map is loaded
  useEffect(() => {
    if (!map || !isLoaded) return;

    try {
      const validCoords = Array.isArray(coordinates) && coordinates.length >= 2 ? coordinates : [];

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: validCoords,
            },
          },
        });
      }

      if (!map.getLayer(layerId)) {
        const paintProps = {
          "line-color": color,
          "line-width": width,
          "line-opacity": opacity,
        };
        if (Array.isArray(dashArray) && dashArray.length > 0) {
          paintProps["line-dasharray"] = dashArray;
        }

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: paintProps,
        });
      }
    } catch (err) {
      console.warn("MapRoute init error:", err);
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {}
    };
  }, [map, isLoaded, sourceId, layerId]);

  // 2. High-performance coordinate updates via setData (never drops or destroys WebGL layer)
  useEffect(() => {
    if (!map || !isLoaded) return;
    try {
      const src = map.getSource(sourceId);
      if (src && typeof src.setData === "function") {
        const validCoords = Array.isArray(coordinates) && coordinates.length >= 2 ? coordinates : [];
        src.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: validCoords,
          },
        });
      }
    } catch (err) {}
  }, [map, isLoaded, coordinates, sourceId]);

  // 3. Update styling properties dynamically
  useEffect(() => {
    if (!map || !isLoaded) return;
    try {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "line-color", color);
        map.setPaintProperty(layerId, "line-width", width);
        map.setPaintProperty(layerId, "line-opacity", opacity);
        if (Array.isArray(dashArray) && dashArray.length > 0) {
          map.setPaintProperty(layerId, "line-dasharray", dashArray);
        }
      }
    } catch (err) {}
  }, [map, isLoaded, color, width, opacity, dashArray, layerId]);

  return null;
}

/**
 * MapGeoJSON - GeoJSON layer renderer supporting fill and line paints
 * Official @mapcn/map compatible GeoJSON overlay component
 */
export function MapGeoJSON({
  id,
  data,
  fillPaint,
  linePaint,
  beforeId,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  const { map, isLoaded } = useMap();
  const autoId = useId();
  const rawId = (id || autoId).toString().replace(/[^a-zA-Z0-9_-]/g, "_");
  const sourceId = `geojson-src-${rawId}`;
  const fillLayerId = `geojson-fill-${rawId}`;
  const lineLayerId = `geojson-line-${rawId}`;

  // Keep latest event handlers in ref
  const handlersRef = useRef({ onClick, onMouseEnter, onMouseLeave });
  useEffect(() => {
    handlersRef.current = { onClick, onMouseEnter, onMouseLeave };
  }, [onClick, onMouseEnter, onMouseLeave]);

  // 1. Initialize source and layers once when map is loaded
  useEffect(() => {
    if (!map || !isLoaded || !data) return;

    try {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data,
        });
      } else {
        map.getSource(sourceId).setData(data);
      }

      if (fillPaint && !map.getLayer(fillLayerId)) {
        map.addLayer(
          {
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: fillPaint,
          },
          beforeId
        );
      }

      if (linePaint && !map.getLayer(lineLayerId)) {
        map.addLayer(
          {
            id: lineLayerId,
            type: "line",
            source: sourceId,
            paint: linePaint,
          },
          beforeId
        );
      }

      const clickHandler = (e) => handlersRef.current.onClick?.(e);
      const enterHandler = (e) => {
        map.getCanvas().style.cursor = "pointer";
        handlersRef.current.onMouseEnter?.(e);
      };
      const leaveHandler = (e) => {
        map.getCanvas().style.cursor = "";
        handlersRef.current.onMouseLeave?.(e);
      };

      if (map.getLayer(fillLayerId)) {
        map.on("click", fillLayerId, clickHandler);
        map.on("mouseenter", fillLayerId, enterHandler);
        map.on("mouseleave", fillLayerId, leaveHandler);
      }
      if (map.getLayer(lineLayerId)) {
        map.on("click", lineLayerId, clickHandler);
        map.on("mouseenter", lineLayerId, enterHandler);
        map.on("mouseleave", lineLayerId, leaveHandler);
      }

      return () => {
        try {
          if (map.getLayer(fillLayerId)) {
            map.off("click", fillLayerId, clickHandler);
            map.off("mouseenter", fillLayerId, enterHandler);
            map.off("mouseleave", fillLayerId, leaveHandler);
            map.removeLayer(fillLayerId);
          }
          if (map.getLayer(lineLayerId)) {
            map.off("click", lineLayerId, clickHandler);
            map.off("mouseenter", lineLayerId, enterHandler);
            map.off("mouseleave", lineLayerId, leaveHandler);
            map.removeLayer(lineLayerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (err) {}
      };
    } catch (err) {
      console.warn("MapGeoJSON mount error:", err);
    }
  }, [map, isLoaded, sourceId, fillLayerId, lineLayerId, beforeId]);

  // 2. High-performance GeoJSON data updates via setData
  useEffect(() => {
    if (!map || !isLoaded || !data) return;
    try {
      const src = map.getSource(sourceId);
      if (src && typeof src.setData === "function") {
        src.setData(data);
      }
    } catch (err) {}
  }, [map, isLoaded, data, sourceId]);

  // 3. Dynamic fillPaint updates
  useEffect(() => {
    if (!map || !isLoaded || !fillPaint) return;
    try {
      if (map.getLayer(fillLayerId)) {
        Object.entries(fillPaint).forEach(([prop, val]) => {
          map.setPaintProperty(fillLayerId, prop, val);
        });
      }
    } catch (err) {}
  }, [map, isLoaded, fillPaint, fillLayerId]);

  // 4. Dynamic linePaint updates
  useEffect(() => {
    if (!map || !isLoaded || !linePaint) return;
    try {
      if (map.getLayer(lineLayerId)) {
        Object.entries(linePaint).forEach(([prop, val]) => {
          map.setPaintProperty(lineLayerId, prop, val);
        });
      }
    } catch (err) {}
  }, [map, isLoaded, linePaint, lineLayerId]);

  return null;
}

/**
 * createGeoJSONCircle: Helper to generate a GeoJSON Polygon circle around [lng, lat]
 * with a specified radius in kilometers.
 *
 * @param {[number, number]} center [longitude, latitude]
 * @param {number} radiusInKm Radius in kilometers (e.g. 1.5)
 * @param {number} points Number of polygon vertices (default: 64)
 * @returns {GeoJSON.FeatureCollection}
 */
export function createGeoJSONCircle(center, radiusInKm = 1.0, points = 64) {
  const [lng, lat] = center;
  const coords = [];
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const dLng = (radiusInKm * Math.cos(angle)) / kmPerLng;
    const dLat = (radiusInKm * Math.sin(angle)) / kmPerLat;
    coords.push([Number((lng + dLng).toFixed(6)), Number((lat + dLat).toFixed(6))]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          radiusKm: radiusInKm,
          center,
        },
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    ],
  };
}

export default Map;
