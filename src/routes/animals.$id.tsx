import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AnimalProfile } from '../features/animals/AnimalProfile';

export const Route = createFileRoute('/animals/$id')({
  component: AnimalProfileRoute,
});

function AnimalProfileRoute() {
  return <AnimalProfile />;
}
