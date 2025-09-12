import { useState, useCallback, useRef } from 'react';

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  pendingTabId: string | null;
  currentTabId: string | null;
}

export const useUnsavedChanges = () => {
  const [state, setState] = useState<UnsavedChangesState>({
    hasUnsavedChanges: false,
    pendingTabId: null,
    currentTabId: null,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveFunctionsRef = useRef<Map<string, () => Promise<void>>>(new Map());
  const discardFunctionsRef = useRef<Map<string, () => void>>(new Map());

  const setUnsavedChanges = useCallback((
    hasChanges: boolean,
    saveFn?: () => Promise<void>,
    discardFn?: () => void,
    tabId?: string
  ) => {
    if (tabId && saveFn) {
      saveFunctionsRef.current.set(tabId, saveFn);
    }
    if (tabId && discardFn) {
      discardFunctionsRef.current.set(tabId, discardFn);
    }

    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
      currentTabId: tabId || prev.currentTabId,
    }));
  }, []);

  const setCurrentTab = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      currentTabId: tabId,
    }));
  }, []);

  const handleTabChange = useCallback((newTabId: string) => {
    if (state.hasUnsavedChanges) {
      setState(prev => ({ ...prev, pendingTabId: newTabId }));
      setIsModalOpen(true);
      return false;
    }
    return true;
  }, [state.hasUnsavedChanges]);

  const handleSaveAndContinue = useCallback(async () => {
    const currentTabId = state.currentTabId;
    if (!currentTabId) {
      return false;
    }

    const saveFunction = saveFunctionsRef.current.get(currentTabId);
    if (!saveFunction) {
      return false;
    }

    setIsSaving(true);
    try {
      await saveFunction();

      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        pendingTabId: null,
      }));
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error; // Re-throw to let the component handle it
    } finally {
      setIsSaving(false);
    }
  }, [state.currentTabId]);

  const handleDiscardAndContinue = useCallback(() => {
    const currentTabId = state.currentTabId;
    if (!currentTabId) {
      return false;
    }

    const discardFunction = discardFunctionsRef.current.get(currentTabId);
    if (discardFunction) {
      discardFunction();
    }

    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      pendingTabId: null,
    }));
    setIsModalOpen(false);
    return true;
  }, [state.currentTabId]);

  const handleCancelTabChange = useCallback(() => {
    setState(prev => ({ ...prev, pendingTabId: null }));
    setIsModalOpen(false);
  }, []);

  return {
    hasUnsavedChanges: state.hasUnsavedChanges,
    pendingTabId: state.pendingTabId,
    isModalOpen,
    isSaving,
    setUnsavedChanges,
    setCurrentTab,
    handleTabChange,
    handleSaveAndContinue,
    handleDiscardAndContinue,
    handleCancelTabChange,
  };
};