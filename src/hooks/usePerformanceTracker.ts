/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { telemetry } from '../services/telemetry';

/**
 * Custom React hook to measure and log component mount and render durations.
 * Uses high-precision performance.now() across mount and update cycles.
 */
export function useComponentPerformanceTracker(componentName: string) {
  const isMountedRef = useRef(false);
  const renderStartTimeRef = useRef(performance.now());

  // Mark start of render
  renderStartTimeRef.current = performance.now();

  useLayoutEffect(() => {
    const duration = performance.now() - renderStartTimeRef.current;
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      telemetry.recordComponentRender(componentName, duration, 'mount');
    } else {
      telemetry.recordComponentRender(componentName, duration, 'update');
    }
  });

  useEffect(() => {
    return () => {
      // Optional unmount cleanup
    };
  }, [componentName]);
}
