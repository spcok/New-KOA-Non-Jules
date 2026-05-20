import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { QueryClient } from '@tanstack/react-query';

// 1. Initialize the central Query engine
export const queryClient = new QueryClient();

// 2. Dynamically route to the Electric Sync engine (zrok tunnel or local)
const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

// 3. Define all Collections using v2 params structure
export const animalsCollection = createCollection(
  electricCollectionOptions({
    id: 'animals',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'animals' } }
  })
);

export const clinicalAttachmentsCollection = createCollection(
  electricCollectionOptions({
    id: 'clinical_attachments',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'clinical_attachments' } }
  })
);

export const clinicalRecordsCollection = createCollection(
  electricCollectionOptions({
    id: 'clinical_records',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'clinical_records' } }
  })
);

export const clinicalScheduleCollection = createCollection(
  electricCollectionOptions({
    id: 'clinical_schedule',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'clinical_schedule' } }
  })
);

export const dailyLogsCollection = createCollection(
  electricCollectionOptions({
    id: 'daily_logs',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'daily_logs' } }
  })
);

export const dailyRoundsCollection = createCollection(
  electricCollectionOptions({
    id: 'daily_rounds',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'daily_rounds' } }
  })
);

export const feedingSchedulesCollection = createCollection(
  electricCollectionOptions({
    id: 'feeding_schedules',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'feeding_schedules' } }
  })
);

export const fireDrillLogsCollection = createCollection(
  electricCollectionOptions({
    id: 'fire_drill_logs',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'fire_drill_logs' } }
  })
);

export const incidentsCollection = createCollection(
  electricCollectionOptions({
    id: 'incidents',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'incidents' } }
  })
);

export const isolationLogsCollection = createCollection(
  electricCollectionOptions({
    id: 'isolation_logs',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'isolation_logs' } }
  })
);

export const maintenanceTicketsCollection = createCollection(
  electricCollectionOptions({
    id: 'maintenance_tickets',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'maintenance_tickets' } }
  })
);

export const medicationLogsCollection = createCollection(
  electricCollectionOptions({
    id: 'medication_logs',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'medication_logs' } }
  })
);

export const operationalListsCollection = createCollection(
  electricCollectionOptions({
    id: 'operational_lists',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'operational_lists' } }
  })
);

export const rolePermissionsCollection = createCollection(
  electricCollectionOptions({
    id: 'role_permissions',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'role_permissions' } }
  })
);

export const safetyIncidentsCollection = createCollection(
  electricCollectionOptions({
    id: 'safety_incidents',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'safety_incidents' } }
  })
);

export const tasksCollection = createCollection(
  electricCollectionOptions({
    id: 'tasks',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'tasks' } }
  })
);

export const timesheetsCollection = createCollection(
  electricCollectionOptions({
    id: 'timesheets',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'timesheets' } }
  })
);

export const usersCollection = createCollection(
  electricCollectionOptions({
    id: 'users',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'users' } }
  })
);
