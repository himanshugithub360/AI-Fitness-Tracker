export type FormState = {
  /** A problem to show above the form. */
  error?: string;
  /** A success note to show above the form. */
  message?: string;
  /** Problems with individual fields, keyed by field name. */
  fieldErrors?: Record<string, string[] | undefined>;
  /** What the person typed, so the form can show it again. Never holds passwords. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};
