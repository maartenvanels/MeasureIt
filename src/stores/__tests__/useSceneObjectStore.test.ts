import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneObjectStore } from '../useSceneObjectStore';

// Minimal mock image for testing
function createMockImage(width = 100, height = 100): HTMLImageElement {
  const img = {} as HTMLImageElement;
  Object.defineProperty(img, 'width', { value: width });
  Object.defineProperty(img, 'height', { value: height });
  return img;
}

beforeEach(() => {
  useSceneObjectStore.getState().reset();
});

describe('useSceneObjectStore', () => {
  describe('addImage', () => {
    it('adds an image object', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj).toBeDefined();
      expect(obj!.type).toBe('image');
      expect(obj!.name).toBe('test.png');
      expect(obj!.image).toBe(img);
    });

    it('sets active and selected to new object', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().activeObjectId).toBe(id);
      expect(useSceneObjectStore.getState().selectedObjectId).toBe(id);
    });

    it('stores dataUrl when provided', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png', 'data:image/png;base64,abc');
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj!.imageDataUrl).toBe('data:image/png;base64,abc');
    });

    it('auto-positions second image with offset', () => {
      const img1 = createMockImage(200, 100);
      useSceneObjectStore.getState().addImage(img1, 'a.png');
      const img2 = createMockImage(100, 100);
      const id2 = useSceneObjectStore.getState().addImage(img2, 'b.png');
      const obj2 = useSceneObjectStore.getState().getObject(id2);
      expect(obj2!.transform.position[0]).toBeGreaterThan(0);
    });

    it('initializes with default reference scale', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj!.referenceValue).toBe(100);
      expect(obj!.referenceUnit).toBe('mm');
    });
  });

  describe('addModel', () => {
    it('adds a model object', () => {
      const id = useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj).toBeDefined();
      expect(obj!.type).toBe('model');
      expect(obj!.name).toBe('model.glb');
      expect(obj!.modelUrl).toBe('blob:test');
      expect(obj!.modelFileType).toBe('glb');
    });
  });

  describe('removeObject', () => {
    it('removes an object', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().objects).toHaveLength(1);
      useSceneObjectStore.getState().removeObject(id);
      expect(useSceneObjectStore.getState().objects).toHaveLength(0);
    });

    it('clears activeObjectId if removed object was active', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().activeObjectId).toBe(id);
      useSceneObjectStore.getState().removeObject(id);
      expect(useSceneObjectStore.getState().activeObjectId).toBeNull();
    });

    it('falls back to first remaining object for activeObjectId', () => {
      const img1 = createMockImage();
      const id1 = useSceneObjectStore.getState().addImage(img1, 'a.png');
      const img2 = createMockImage();
      const id2 = useSceneObjectStore.getState().addImage(img2, 'b.png');
      // id2 is active (last added)
      useSceneObjectStore.getState().removeObject(id2);
      expect(useSceneObjectStore.getState().activeObjectId).toBe(id1);
    });
  });

  describe('updateObject', () => {
    it('patches object properties', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().updateObject(id, { name: 'renamed.png', locked: true });
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj!.name).toBe('renamed.png');
      expect(obj!.locked).toBe(true);
    });
  });

  describe('setTransform', () => {
    it('merges transform partially', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().setTransform(id, { position: [10, 20, 30] });
      const obj = useSceneObjectStore.getState().getObject(id);
      expect(obj!.transform.position).toEqual([10, 20, 30]);
      expect(obj!.transform.scale).toEqual([1, 1, 1]); // unchanged
    });
  });

  describe('visibility and locking', () => {
    it('toggles visibility', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().getObject(id)!.visible).toBe(true);
      useSceneObjectStore.getState().toggleObjectVisibility(id);
      expect(useSceneObjectStore.getState().getObject(id)!.visible).toBe(false);
      useSceneObjectStore.getState().toggleObjectVisibility(id);
      expect(useSceneObjectStore.getState().getObject(id)!.visible).toBe(true);
    });

    it('toggles locked', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().getObject(id)!.locked).toBe(false);
      useSceneObjectStore.getState().toggleObjectLocked(id);
      expect(useSceneObjectStore.getState().getObject(id)!.locked).toBe(true);
    });
  });

  describe('reference scale per object', () => {
    it('sets reference value', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().setObjectReferenceValue(id, 250);
      expect(useSceneObjectStore.getState().getObject(id)!.referenceValue).toBe(250);
    });

    it('sets reference unit', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().setObjectReferenceUnit(id, 'cm');
      expect(useSceneObjectStore.getState().getObject(id)!.referenceUnit).toBe('cm');
    });
  });

  describe('getters', () => {
    it('getImages returns only images', () => {
      const img = createMockImage();
      useSceneObjectStore.getState().addImage(img, 'img.png');
      useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      expect(useSceneObjectStore.getState().getImages()).toHaveLength(1);
      expect(useSceneObjectStore.getState().getImages()[0].type).toBe('image');
    });

    it('getModels returns only models', () => {
      const img = createMockImage();
      useSceneObjectStore.getState().addImage(img, 'img.png');
      useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      expect(useSceneObjectStore.getState().getModels()).toHaveLength(1);
      expect(useSceneObjectStore.getState().getModels()[0].type).toBe('model');
    });

    it('getActiveObject returns the active object', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().getActiveObject()?.id).toBe(id);
    });

    it('getActiveImage returns active image element', () => {
      const img = createMockImage();
      useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().getActiveImage()).toBe(img);
    });

    it('getActiveImage returns null for model', () => {
      useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      expect(useSceneObjectStore.getState().getActiveImage()).toBeNull();
    });

    it('getFirstVisibleImage returns first visible image', () => {
      const img1 = createMockImage();
      const id1 = useSceneObjectStore.getState().addImage(img1, 'a.png');
      const img2 = createMockImage();
      useSceneObjectStore.getState().addImage(img2, 'b.png');
      // Hide first, should return second
      useSceneObjectStore.getState().toggleObjectVisibility(id1);
      expect(useSceneObjectStore.getState().getFirstVisibleImage()).toBe(img2);
    });

    it('hasContent returns true when objects exist', () => {
      expect(useSceneObjectStore.getState().hasContent()).toBe(false);
      const img = createMockImage();
      useSceneObjectStore.getState().addImage(img, 'test.png');
      expect(useSceneObjectStore.getState().hasContent()).toBe(true);
    });

    it('hasModels returns true when models exist', () => {
      expect(useSceneObjectStore.getState().hasModels()).toBe(false);
      useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      expect(useSceneObjectStore.getState().hasModels()).toBe(true);
    });
  });

  describe('selection', () => {
    it('setActiveObject changes active', () => {
      const img1 = createMockImage();
      const id1 = useSceneObjectStore.getState().addImage(img1, 'a.png');
      const img2 = createMockImage();
      useSceneObjectStore.getState().addImage(img2, 'b.png');
      useSceneObjectStore.getState().setActiveObject(id1);
      expect(useSceneObjectStore.getState().activeObjectId).toBe(id1);
    });

    it('selectObject changes selected', () => {
      const img = createMockImage();
      const id = useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().selectObject(null);
      expect(useSceneObjectStore.getState().selectedObjectId).toBeNull();
      useSceneObjectStore.getState().selectObject(id);
      expect(useSceneObjectStore.getState().selectedObjectId).toBe(id);
    });
  });

  describe('reset', () => {
    it('clears all objects and state', () => {
      const img = createMockImage();
      useSceneObjectStore.getState().addImage(img, 'test.png');
      useSceneObjectStore.getState().addModel('blob:test', 'model.glb', 'glb');
      expect(useSceneObjectStore.getState().objects).toHaveLength(2);
      useSceneObjectStore.getState().reset();
      expect(useSceneObjectStore.getState().objects).toHaveLength(0);
      expect(useSceneObjectStore.getState().activeObjectId).toBeNull();
      expect(useSceneObjectStore.getState().selectedObjectId).toBeNull();
    });
  });
});
