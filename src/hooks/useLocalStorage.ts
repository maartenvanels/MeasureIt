'use client';

import { useCallback } from 'react';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { SavedProject } from '@/types/measurement';

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
      for (const m of project.measurements) {
        if (m.type === 'area') {
          store.addArea(m);
        } else if (m.type === 'angle') {
          store.addAngle(m);
        } else if (m.type === 'annotation') {
          store.addAnnotation(m);
        } else {
          store.addMeasurement(m);
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
