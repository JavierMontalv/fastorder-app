import { useState } from "react";

export default function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const reset = () => setValues(initialValues);

  return {
    values,
    setValues,
    handleChange,
    reset,
  };
}
