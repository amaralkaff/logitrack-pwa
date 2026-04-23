import { createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';
import { RequireAuth } from './RequireAuth';
import LoginScreen from '@/features/auth/LoginScreen';
import HomeScreen from '@/features/home/HomeScreen';
import InventoryScreen from '@/features/inventory/InventoryScreen';
import ItemDetailScreen from '@/features/inventory/ItemDetailScreen';
import EmptyScreen from '@/features/inventory/EmptyScreen';
import HistoryScreen from '@/features/history/HistoryScreen';
import ProfileScreen from '@/features/profile/ProfileScreen';
import ChoiceScreen from '@/features/scan/ChoiceScreen';
import ViewfinderScreen from '@/features/scan/ViewfinderScreen';
import SuccessScreen from '@/features/scan/SuccessScreen';
import ErrorScreen from '@/features/scan/ErrorScreen';
import ManualScreen from '@/features/scan/ManualScreen';
import SyncQueueScreen from '@/features/sync/SyncQueueScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: LoginScreen },
      { path: 'home',        element: <RequireAuth><HomeScreen/></RequireAuth> },
      { path: 'inv',         element: <RequireAuth><InventoryScreen/></RequireAuth> },
      { path: 'inv/:sku',    element: <RequireAuth><ItemDetailScreen/></RequireAuth> },
      { path: 'empty',       element: <RequireAuth><EmptyScreen/></RequireAuth> },
      { path: 'hist',        element: <RequireAuth><HistoryScreen/></RequireAuth> },
      { path: 'me',          element: <RequireAuth><ProfileScreen/></RequireAuth> },
      { path: 'scan',        element: <RequireAuth><ChoiceScreen/></RequireAuth> },
      { path: 'scan/qr',     element: <RequireAuth><ViewfinderScreen mode="qr"/></RequireAuth> },
      { path: 'scan/ocr',    element: <RequireAuth><ViewfinderScreen mode="ocr"/></RequireAuth> },
      { path: 'scan/manual', element: <RequireAuth><ManualScreen/></RequireAuth> },
      { path: 'scan/success',element: <RequireAuth><SuccessScreen/></RequireAuth> },
      { path: 'scan/error',  element: <RequireAuth><ErrorScreen/></RequireAuth> },
      { path: 'sync',        element: <RequireAuth><SyncQueueScreen/></RequireAuth> },
    ],
  },
]);
