'use client';

import { useCallback } from 'react';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { SavedProject, AreaMeasurement, Measurement, AnyMeasurement } from '@/types/measurement';

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
      start3D: m.start, // legacy Measurement3D stored Point3D in start/end
      end3D: m.end,
      distance,
    } as Measurement;
  }
  return m as AnyMeasurement;
}

export function useLocalStorage() {
  const saveProject = useCallback((name?: string) => {
    const { measurements, referenceValue, referenceUnit } =
      useMeasurementStore.getState();

    const id = crypto.randomUUID();
    const project: SavedProject = {
      id,
      name: name || `Project ${new Date().toLocaleString()}`,
      measurements,
      referenceValue,
      referenceUnit,
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
      const project: SavedProject = JSON.parse(raw);

      const store = useMeasurementStore.getState();
      // Clear current and load saved measurements
      store.clearAll();
      for (const raw of project.measurements) {
        // Migration: convert legacy reference3d/measure3d to unified Measurement
        const m = migrateLegacy(raw);

        if (m.type === 'area') {
          // Migration: old projects may lack areaKind
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
      store.setReferenceValue(project.referenceValue);
      store.setReferenceUnit(project.referenceUnit);

      return project;
    } catch {
      return null;
    }
  }, []);

  const listProjects = useCallback((): SavedProject[] => {
    const index = readIndex();
    const projects: SavedProject[] = [];
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
