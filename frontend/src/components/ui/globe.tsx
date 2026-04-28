"use client";
import { useEffect, useRef, useState } from "react";
import { Color, Scene, Fog } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "../../data/globe.json";

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: any;
  }
}

extend({ ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

export interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeData, setGlobeData] = useState<any[] | null>(null);
  const globeRef = useRef<any>(null);

  const defaultProps = {
    pointSize: 1,
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (globeRef.current) {
      _buildData();
      _buildMaterial();
    }
  }, [globeRef.current]);

  const _buildMaterial = () => {
    if (!globeRef.current) return;

    const globeMaterial = globeRef.current.globeMaterial() as any;
    globeMaterial.color = new Color(defaultProps.globeColor);
    globeMaterial.emissive = new Color(defaultProps.emissive);
    globeMaterial.emissiveIntensity = defaultProps.emissiveIntensity || 0.1;
    globeMaterial.shininess = defaultProps.shininess || 0.9;
  };

  const _buildData = () => {
    const arcs = data;
    const points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      const rgb = hexToRgb(arc.color);
      if (!rgb) continue;
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        id: `point${i}`,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        id: `point${i}`,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) => v2.lat === v.lat && v2.lng === v.lng) === i
    );

    setGlobeData(filteredPoints);
  };

  useEffect(() => {
    if (globeRef.current && globeData) {
      globeRef.current
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(defaultProps.atmosphereColor)
        .atmosphereAltitude(defaultProps.atmosphereAltitude)
        .hexPolygonColor(() => defaultProps.polygonColor);

      globeRef.current
        .arcsData(data)
        .arcStartLat((d: any) => d.startLat * 1)
        .arcStartLng((d: any) => d.startLng * 1)
        .arcEndLat((d: any) => d.endLat * 1)
        .arcEndLng((d: any) => d.endLng * 1)
        .arcColor((e: any) => e.color)
        .arcAltitude((e: any) => e.arcAlt * 1)
        .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
        .arcDashLength(defaultProps.arcLength)
        .arcDashInitialGap((e: any) => e.order * 1)
        .arcDashGap(15)
        .arcDashAnimateTime(() => defaultProps.arcTime);

      globeRef.current
        .pointsData(globeData)
        .pointColor((e: any) => e.color)
        .pointsMerge(true)
        .pointAltitude(0.0)
        .pointRadius(2);

      globeRef.current
        .ringsData(globeData)
        .ringColor((e: any) => e.color)
        .ringMaxRadius(defaultProps.maxRings)
        .ringPropagationSpeed(RING_PROPAGATION_SPEED)
        .ringRepeatPeriod(defaultProps.arcTime / defaultProps.rings);
    }
  }, [globeRef.current, globeData]);

  return (
    <>
      <threeGlobe ref={globeRef} />
    </>
  );
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffffff, 0);
  }, [gl, size]);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const scene = new Scene();
  scene.fog = new Fog(0xffffff, 400, 2000);

  return (
    <Canvas scene={scene} camera={{ position: [0, 0, cameraZ], fov: 45 }}>
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={[-400, 100, 400]}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={[200, 500, 200]}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={[-200, 500, 200]}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={cameraZ}
        maxDistance={cameraZ}
        autoRotateSpeed={1}
        autoRotate={true}
      />
    </Canvas>
  );
}

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
