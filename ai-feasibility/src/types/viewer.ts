export type Vec3 = [number, number, number];

/** Where the model sits and how it is turned. Rotation is in radians around the model's own X, Y, Z axes. */
export type ModelTransform = { position: Vec3; rotation: Vec3 };

export const IDENTITY_TRANSFORM: ModelTransform = { position: [0, 0, 0], rotation: [0, 0, 0] };

/** Facts about a loaded file, recorded for the feasibility table. */
export type ModelStats = {
  fileName: string;
  sizeBytes: number;
  meshes: number;
  triangles: number;
  /** animation clips present in the file; the viewer never plays them */
  ignoredAnimations: number;
  loadMs: number;
};
