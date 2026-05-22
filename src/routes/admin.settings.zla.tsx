import { createFileRoute } from '@tanstack/react-router';
import ZLADocuments from '../features/settings/ZLADocuments';

export const Route = createFileRoute('/admin/settings/zla')({
  component: ZLADocuments,
});