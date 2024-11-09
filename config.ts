import { RegistryConfig } from './src/types';
// import { getLocalIp } from './system_info';

// const localIp = await getLocalIp();

export const config: RegistryConfig = {
  isMaster: process.env.IS_MASTER === 'true',
  masterUrl: process.env.MASTER_URL, // `http://${localIp}:3899`,
  nodePort: parseInt(process.env.NODE_PORT || '3800', 10),
  frontendPort: parseInt(process.env.FRONTEND_PORT || '3869', 10)
};