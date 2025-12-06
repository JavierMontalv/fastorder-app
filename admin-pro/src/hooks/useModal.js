import { useState } from "react";

export default function useModal(initial = false) {
  const [open, setOpen] = useState(initial);

  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
    toggleModal: () => setOpen((v) => !v),
  };
}
