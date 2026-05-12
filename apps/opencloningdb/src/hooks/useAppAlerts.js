import { useDispatch } from 'react-redux';
import { appActions } from '../store/appReducer';

export default function useAppAlerts() {
  const dispatch = useDispatch();

  const addAlert = (alert) => {
    const newAlert = { ...alert };
    if (typeof newAlert.message !== 'string') {
      newAlert.message = JSON.stringify(newAlert.message);
    }
    dispatch(appActions.addAlert(newAlert));
  };

  const removeAlert = (message) => {
    dispatch(appActions.removeAlert(message));
  };

  return { addAlert, removeAlert };
}
