import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // Keep server rendering deterministic; the native color scheme hook provides
  // the client value when the component hydrates without an extra state update.
  return useRNColorScheme() ?? 'light';
}
