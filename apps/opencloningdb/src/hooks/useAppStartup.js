import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import useBackendRoute from '../../../../packages/ui/src/hooks/useBackendRoute';
import { useQuery } from '@tanstack/react-query';
import useHttpClient from '../../../../packages/ui/src/hooks/useHttpClient';

const { updateAppInfo } = cloningActions;

function useAppInfo() {
  const user = useSelector((state) => state.auth.user);
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const { data: response } = useQuery({
    queryKey: ['appInfo', user?.id],
    queryFn: () => httpClient.get(backendRoute('version')),
    enabled: Boolean(user),
  });
  return response?.data;
}

function useAppStartup() {
  const appInfo = useAppInfo();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (appInfo) {
      const payload = {
        backendVersion: appInfo.backend_version,
        schemaVersion: appInfo.schema_version,
        frontendVersion: appInfo.frontend_version,
      };
      dispatch(updateAppInfo(payload));
    }
  }, [appInfo, dispatch]);
}

export default useAppStartup;
