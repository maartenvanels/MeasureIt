'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import type { Measurement } from '@/types/measurement';
import { SceneTreeTopLevel } from './SceneTreeTopLevel';
import { SceneTreeGroup } from './SceneTreeGroup';

export function SceneBrowser() {
  const measurements = useMeasurementStore((s) => s.measurements);
  const objects = useSceneObjectStore((s) => s.objects);

  // Group measurements by surfaceId (or legacy surface field)
  const objectMeasurements = useMemo(() => {
    const byObject = new Map<string, typeof measurements>();

    for (const m of measurements) {
      const surfaceId = m.surfaceId;
      if (surfaceId) {
        const arr = byObject.get(surfaceId) ?? [];
        arr.push(m);
        byObject.set(surfaceId, arr);
      }
    }
    return byObject;
  }, [measurements]);

  // Legacy measurements without surfaceId (for backward compatibility)
  const legacyMeasurements = useMemo(() => {
    return measurements.filter((m) => !m.surfaceId);
  }, [measurements]);

  const legacyGroups = useMemo(() => {
    const imageRefs = legacyMeasurements.filter(
      (m) => m.type === 'reference' && ((m as Measurement).surface ?? 'image') === 'image'
    );
    const imageMeasures = legacyMeasurements.filter(
      (m) => m.type === 'measure' && ((m as Measurement).surface ?? 'image') === 'image'
    );
    const angles = legacyMeasurements.filter((m) => m.type === 'angle');
    const areas = legacyMeasurements.filter((m) => m.type === 'area');
    const modelRefs = legacyMeasurements.filter(
      (m) => m.type === 'reference' && (m as Measurement).surface === 'model'
    );
    const modelMeasures = legacyMeasurements.filter(
      (m) => m.type === 'measure' && (m as Measurement).surface === 'model'
    );
    return { imageRefs, imageMeasures, angles, areas, modelRefs, modelMeasures };
  }, [legacyMeasurements]);

  // Annotations are surface-independent — always shown at root
  const annotations = useMemo(() =>
    measurements.filter((m) => m.type === 'annotation'),
    [measurements]
  );

  const hasLegacyImageContent = legacyGroups.imageRefs.length > 0 || legacyGroups.imageMeasures.length > 0
    || legacyGroups.angles.length > 0 || legacyGroups.areas.length > 0;
  const hasLegacyModelContent = legacyGroups.modelRefs.length > 0 || legacyGroups.modelMeasures.length > 0;

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {/* Scene objects — each with its own measurements */}
        {objects.map((obj) => {
          const objMeasurements = objectMeasurements.get(obj.id) ?? [];
          const refs = objMeasurements.filter((m) => m.type === 'reference');
          const measures = objMeasurements.filter((m) => m.type === 'measure');
          const angles = objMeasurements.filter((m) => m.type === 'angle');
          const areas = objMeasurements.filter((m) => m.type === 'area');

          return (
            <SceneTreeTopLevel
              key={obj.id}
              label={obj.name}
              type={obj.type === 'image' ? 'image' : 'model'}
              objectId={obj.id}
            >
              <SceneTreeGroup groupKey={`${obj.id}-references`} label="References" items={refs} />
              <SceneTreeGroup groupKey={`${obj.id}-measurements`} label="Measurements" items={measures} />
              {obj.type === 'image' && (
                <>
                  <SceneTreeGroup groupKey={`${obj.id}-angles`} label="Angles" items={angles} />
                  <SceneTreeGroup groupKey={`${obj.id}-areas`} label="Areas" items={areas} />
                </>
              )}
            </SceneTreeTopLevel>
          );
        })}

        {/* Legacy measurements without surfaceId (from old saves) */}
        {hasLegacyImageContent && objects.every((o) => o.type !== 'image') && (
          <SceneTreeTopLevel label="Image (legacy)" type="image">
            <SceneTreeGroup groupKey="legacy-image-references" label="References" items={legacyGroups.imageRefs} />
            <SceneTreeGroup groupKey="legacy-image-measurements" label="Measurements" items={legacyGroups.imageMeasures} />
            <SceneTreeGroup groupKey="legacy-image-angles" label="Angles" items={legacyGroups.angles} />
            <SceneTreeGroup groupKey="legacy-image-areas" label="Areas" items={legacyGroups.areas} />
          </SceneTreeTopLevel>
        )}

        {hasLegacyModelContent && objects.every((o) => o.type !== 'model') && (
          <SceneTreeTopLevel label="Model (legacy)" type="model">
            <SceneTreeGroup groupKey="legacy-model-references" label="References" items={legacyGroups.modelRefs} />
            <SceneTreeGroup groupKey="legacy-model-measurements" label="Measurements" items={legacyGroups.modelMeasures} />
          </SceneTreeTopLevel>
        )}

        {/* Annotations — surface-independent */}
        <SceneTreeGroup groupKey="annotations" label="Annotations" items={annotations} />

        {/* Grid toggle */}
        <SceneTreeTopLevel label="Grid" type="grid" />
      </div>
    </ScrollArea>
  );
}
