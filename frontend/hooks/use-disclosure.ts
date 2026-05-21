import { useState, useCallback } from "react";

interface DisclosureState<T> {
  isOpen: boolean;
  data: T | undefined;
}

export function useDisclosure<T = undefined>(defaultOpen = false) {
  const [state, setState] = useState<DisclosureState<T>>({
    isOpen: defaultOpen,
    data: undefined,
  });

  const open = useCallback((data?: T) => setState({ isOpen: true, data }), []);
  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);
  const toggle = useCallback(() => setState((s) => ({ ...s, isOpen: !s.isOpen })), []);
  const onOpenChange = useCallback((o: boolean) => setState((s) => ({ ...s, isOpen: o })), []);

  return { isOpen: state.isOpen, data: state.data, open, close, toggle, onOpenChange };
}
