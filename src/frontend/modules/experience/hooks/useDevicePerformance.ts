"use client";

import { useDetectGPU } from "@react-three/drei";

export interface DevicePerformanceProfile {
  tier: number;
  isMobile: boolean;
  dpr: [number, number];
  shadows: "soft" | false;
  shadowMapSize: [number, number];
  enablePageShadows: boolean;
}

/**
 * Adaptive GPU Tier Detection & Performance Profile Engine
 *
 * Dynamically profiles the client's GPU hardware capabilities via WebGL unmasked
 * renderer strings and configures hardware shadow maps, resolution scaling (DPR),
 * and skinned mesh shadow casting to maintain a consistent 60 FPS across mobile and desktop.
 */
export function useDevicePerformance(): DevicePerformanceProfile {
  const gpu = useDetectGPU();

  // Default safely to Tier 2 (balanced) during async detection phase
  const tier = gpu?.tier ?? 2;
  const isMobile = Boolean(gpu?.isMobile);

  const nativeDpr =
    typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;

  // Tier 0 & 1: Low-end mobile devices, integrated budget GPUs, or battery saver
  // Disable heavy shadow map calculations to prevent thermal throttling
  if (tier <= 1) {
    return {
      tier,
      isMobile,
      dpr: [1, Math.min(nativeDpr, 2)],
      shadows: false,
      shadowMapSize: [512, 512],
      enablePageShadows: false,
    };
  }

  // Tier 2: Mainstream smartphones (Snapdragon / Dimensity / Mali) and laptops
  // Balanced: 2.0x DPR max provides razor-sharp text without overtaxing mobile fill rates
  if (tier === 2) {
    return {
      tier,
      isMobile,
      dpr: [1, Math.min(nativeDpr, 2.0)],
      shadows: "soft",
      shadowMapSize: [720, 720],
      enablePageShadows: false,
    };
  }

  // Tier 3: Dedicated workstation GPUs (RTX, Apple Silicon M-series, high-end desktop)
  return {
    tier,
    isMobile,
    dpr: [1, Math.min(nativeDpr, 2.0)],
    shadows: "soft",
    shadowMapSize: [1024, 1024],
    enablePageShadows: !isMobile,
  };
}
