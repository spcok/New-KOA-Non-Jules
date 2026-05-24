import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { QueryClient } from '@tanstack/react-query';

// 1. Initialize the central Query engine
export const queryClient = new QueryClient();

// 2. Dynamically route to the Electric Sync engine
const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

// 3. Define all Collections
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

export const shiftsCollection = createCollection(
  electricCollectionOptions({
    id: 'shifts',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'shifts' } }
  })
);

export const leaveRequestsCollection = createCollection(
  electricCollectionOptions({
    id: 'leave_requests',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'leave_requests' } }
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

export const firstAidLogsCollection = createCollection(
  electricCollectionOptions({
    id: 'first_aid_logs',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'first_aid_logs' } }
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

export const organisationsCollection = createCollection(
  electricCollectionOptions({
    id: 'organisations',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'organisations' } }
  })
);

export const rolePermissionsCollection = createCollection(
  electricCollectionOptions({
    id: 'role_permissions',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'role_permissions' } }
  })
);

export const safetyDrillsCollection = createCollection(
  electricCollectionOptions({
    id: 'safety_drills',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'safety_drills' } }
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

export const zlaDocumentsCollection = createCollection(
  electricCollectionOptions({
    id: 'zla_documents',
    getKey: (row: any) => row.id,
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: 'zla_documents' } }
  })
);