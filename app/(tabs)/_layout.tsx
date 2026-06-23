import React from 'react';
import ApuntesScreen from './apuntes';
import { TabProvider } from '../../context/TabContext';

export default function TabLayout() {
  return (
    <TabProvider>
      <ApuntesScreen />
    </TabProvider>
  );
}