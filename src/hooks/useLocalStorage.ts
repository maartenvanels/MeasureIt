'use client';

import { useCallback } from 'react';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { SavedProject, SavedProjectV2, AreaMeasurement, Measurement, AnyMeasurement } from '@/types/measurement';
import type { SerializedSceneObject } from '@/types/scene-object';

const KEY_PREFIX = 'measureit_projects_';

function getProjectKey(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

function getIndexKey(): string {
  return `${KEY_PREFIX}index`;
}

interface ProjectIndex {
  ids: string[];
}

function readIndex(): ProjectIndex {
  try {
    const raw = localStorage.getItem(getIndexKey());
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { ids: [] };
}

function writeIndex(index: ProjectIndex): void {
  localStorage.setItem(getIndexKey(), JSON.stringify(index));
}

/**
 * Migrate legacy Measurement3D (reference3d/measure3d) to unified Measurement with surface='model'.
 */
function migrateLegacy(m: any): AnyMeasurement {
  if (m.type === 'reference3d' || m.type === 'measure3d') {
    const type = m.type === 'reference3d' ? 'reference' : 'measure';
    const distance = m.distance ?? 0;
    return {
      id: m.id,
      type,
      name: m.name,
      createdAt: m.createdAt,
      color: m.color,
      unitOverride: m.unitOverride,
      labelOffset: m.labelOffset,
      nameLabelOffset: m.nameLabelOffset,
      fontSize: m.fontSize,
      surface: 'model',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
      pixelLength: distance,
      start3D: m.start,
      end3D: m.end,
      distance,
    } as Measurement;
  }
  return m as AnyMeasurement;
}

/** Serialize scene objects for storage (strip HTMLImageElement, blob URLs) */
function serializeObjects(): SerializedSceneObject[] {
  const { objects } = useSceneObjectStore.getState();
  return objects.map((obj) => ({
    id: obj.id,
    type: obj.type,
    name: obj.name,
    imageDataUrl: obj.imageDataUrl,
    modelFileType: obj.modelFileType,
    transform: { ...obj.transform },
    visible: obj.visible,
    locked: obj.locked,
    referenceValue: obj.referenceValue,
    referenceUnit: obj.referenceUnit,
    order: obj.order,
  }));
}

/** Deserialize and restore scene objects from saved data */
function restoreObjects(serialized: SerializedSceneObject[]): void {
  const store = useSceneObjectStore.getState();
  store.reset();

  for (const obj of serialized) {
    if (obj.type === 'image' && obj.imageDataUrl) {
      // Restore image from data URL
      const img = new Image();
      const savedObj = obj;
      img.onload = () => {
        const id = store.addImage(img, savedObj.name, savedObj.imageDataUrl);
        // Restore saved properties (overwrite auto-generated values)
        store.updateObject(id, {
          transform: savedObj.transform,
          visible: savedObj.visible,
          locked: savedObj.locked,
          referenceValue: savedObj.referenceValue,
          referenceUnit: savedObj.referenceUnit,
          order: savedObj.order,
        });
        // Bridge: also populate old canvas store
        useCanvasStore.getState().setImage(img, savedObj.name);
      };
      img.src = obj.imageDataUrl;
    } else if (obj.type === 'model') {
      // Models too large for localStorage — add placeholder, user must re-import
      const id = store.addModel('', obj.name, obj.modelFileType ?? 'glb');
      store.updateObject(id, {
        transform: obj.transform,
        visible: false, // Hidden until re-imported
        locked: obj.locked,
        referenceValue: obj.referenceValue,
        referenceUnit: obj.referenceUnit,
        order: obj.order,
      });
    }
  }
}

/** Check if a raw project is V2 format */
function isV2(project: any): project is SavedProjectV2 {
  return project.version === 2;
}

/** Load measurements into store (shared between V1 and V2) */
function loadMeasurements(measurements: any[], useLegacyMigration: boolean): void {
  const store = useMeasurementStore.getState();
  for (const rawM of measurements) {
    const m = useLegacyMigration ? migrateLegacy(rawM) : (rawM as AnyMeasurement);
    if (m.type === 'area') {
      if (!(m as AreaMeasurement).areaKind) {
        (m as AreaMeasurement).areaKind = 'polygon';
      }
      store.addArea(m as AreaMeasurement);
    } else if (m.type === 'angle') {
      store.addAngle(m);
    } else if (m.type === 'annotation') {
      store.addAnnotation(m);
    } else if (m.type === 'reference' || m.type === 'measure') {
      store.addMeasurement(m as Measurement);
    }
  }
}

export function useLocalStorage() {
  const saveProject = useCallback((name?: string) => {
    const { measurements } = useMeasurementStore.getState();
    const objects = serializeObjects();

    const id = crypto.randomUUID();
    const project: SavedProjectV2 = {
      version: 2,
      id,
      name: name || `Project ${new Date().toLocaleString()}`,
      objects,
      measurements,
      updatedAt: Date.now(),
    };

    localStorage.setItem(getProjectKey(id), JSON.stringify(project));

    const index = readIndex();
    index.ids.push(id);
    writeIndex(index);

    return project;
  }, []);

  const loadProject = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem(getProjectKey(id));
      if (!raw) return null;
      const project = JSON.parse(raw);

      const mStore = useMeasurementStore.getState();
      mStore.clearAll();
      useCanvasStore.getState().reset();

      if (isV2(project)) {
        // V2 format: restore scene objects and measurements
        restoreObjects(project.objects);
        loadMeasurements(project.measurements, false);
      } else {
        // V1 format: legacy migration
        const v1 = project as SavedProject;
        useSceneObjectStore.getState().reset();
        loadMeasurements(v1.measurements, true);
        mStore.setReferenceValue(v1.referenceValue);
        mStore.setReferenceUnit(v1.referenceUnit);
      }

      return project;
    } catch {
      return null;
    }
  }, []);

  const listProjects = useCallback((): (SavedProject | SavedProjectV2)[] => {
    const index = readIndex();
    const projects: (SavedProject | SavedProjectV2)[] = [];
    for (const id of index.ids) {
      try {
        const raw = localStorage.getItem(getProjectKey(id));
        if (raw) {
          projects.push(JSON.parse(raw));
        }
      } catch {
        // skip corrupt entries
      }
    }
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);

  const deleteProject = useCallback((id: string) => {
    localStorage.removeItem(getProjectKey(id));
    const index = readIndex();
    index.ids = index.ids.filter((i) => i !== id);
    writeIndex(index);
  }, []);

  return { saveProject, loadProject, listProjects, deleteProject };
}
