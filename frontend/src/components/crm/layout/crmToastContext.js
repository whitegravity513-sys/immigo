import { createContext, useContext } from "react";

export const CrmToastContext = createContext({
  showToast: () => {},
});

export const useCrmToast = () => useContext(CrmToastContext);

