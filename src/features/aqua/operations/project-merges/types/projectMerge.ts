import { z } from 'zod';

export interface ProjectMergeSourceDto {
  id: number;
  sourceProjectId: number;
  sourceProjectCode: string;
  sourceProjectName: string;
}

export interface ProjectMergeCageDto {
  id: number;
  sourceProjectId: number;
  projectCageId: number;
  cageId: number;
  cageCode: string;
  cageName: string;
}

export interface ProjectMergeDto {
  id: number;
  targetProjectId: number;
  targetProjectCode: string;
  targetProjectName: string;
  mergeDate: string;
  description?: string | null;
  sourceProjectStateAfterMerge: number;
  sourceProjects: ProjectMergeSourceDto[];
  cages: ProjectMergeCageDto[];
}

export interface CreateProjectMergeDto {
  targetProjectId: number;
  mergeDate: string;
  description?: string;
  sourceProjectStateAfterMerge: number;
  sourceProjectIds: number[];
}

export const projectMergeFormSchema = z.object({
  targetProjectId: z.coerce.number().int().positive('common.required'),
  mergeDate: z.string().min(1, 'common.required'),
  description: z.string().max(500).optional(),
  sourceProjectStateAfterMerge: z.coerce.number().int().min(0).max(1),
  sourceProjectIds: z.array(z.coerce.number().int().positive()).min(1, 'common.required'),
});

export type ProjectMergeFormSchema = z.infer<typeof projectMergeFormSchema>;
