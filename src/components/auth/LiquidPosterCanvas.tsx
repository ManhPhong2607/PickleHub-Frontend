'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LiquidPosterCanvasProps {
  isLogin: boolean;
}

export const LiquidPosterCanvas: React.FC<LiquidPosterCanvasProps> = ({ isLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.error('WebGL not supported', err);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform float uLiquidIntensity;
      uniform bool uIsLogin;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        
        // Fluid trigonometric liquid distortion
        float time = iTime * 2.0;
        for(float i = 1.0; i < 8.0; i++) {
          uv.x += (0.08 * uLiquidIntensity) / i * cos(i * 3.0 * uv.y + time);
          uv.y += (0.08 * uLiquidIntensity) / i * sin(i * 2.5 * uv.x + time);
        }

        // Color palette - PickleHub Emerald & Dark Sapphire Teal
        vec3 colorEmerald = vec3(0.04, 0.45, 0.32);
        vec3 colorDark = vec3(0.06, 0.09, 0.16);
        vec3 colorAccent = uIsLogin ? vec3(0.06, 0.72, 0.51) : vec3(0.12, 0.58, 0.95);

        float wave = sin(uv.x * 6.0 + uv.y * 6.0 + time) * 0.5 + 0.5;
        vec3 finalColor = mix(colorDark, colorEmerald, wave);
        finalColor = mix(finalColor, colorAccent, sin(uv.y * 4.0 - time) * 0.3 + 0.3);

        gl_FragColor = vec4(finalColor, 0.85);
      }
    `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uLiquidIntensity: { value: 1.0 },
      uIsLogin: { value: isLogin },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    window.addEventListener('resize', onResize);

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.setAnimationLoop(null);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uIsLogin.value = isLogin;
      // Pulse liquid intensity on tab change
      materialRef.current.uniforms.uLiquidIntensity.value = 3.5;
      const timer = setTimeout(() => {
        if (materialRef.current) {
          materialRef.current.uniforms.uLiquidIntensity.value = 1.0;
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLogin]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    />
  );
};
