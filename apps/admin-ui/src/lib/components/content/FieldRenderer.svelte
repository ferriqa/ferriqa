<script lang="ts">
  import type { FieldDefinition } from "../blueprint/types";
  import TextField from "./TextField.svelte";
  import TextAreaField from "./TextAreaField.svelte";
  import NumberField from "./NumberField.svelte";
  import BooleanField from "./BooleanField.svelte";
  import DateField from "./DateField.svelte";
  import SelectField from "./SelectField.svelte";
  import MultiSelectField from "./MultiSelectField.svelte";
  import RichTextField from "./RichTextField.svelte";

  interface Props {
    field: FieldDefinition;
    value?: unknown;
    error?: string;
    onchange?: (key: string, value: unknown) => void;
  }

  let { 
    field, 
    value, 
    error,
    onchange 
  }: Props = $props();

  // Field component mapping - using type assertion to avoid complex generic issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fieldComponents: Record<string, any> = {
    text: TextField,
    textarea: TextAreaField,
    email: TextField,
    url: TextField,
    slug: TextField,
    number: NumberField,
    boolean: BooleanField,
    date: DateField,
    datetime: DateField,
    select: SelectField,
    multiselect: MultiSelectField,
    richtext: RichTextField,
  };

  // Get the appropriate component for this field type
  const FieldComponent = fieldComponents[field.type];

  // Handle field value changes
  function handleChange(newValue: unknown) {
    onchange?.(field.key, newValue);
  }

  // Initialize value if not set
  $effect(() => {
    if (value === undefined || value === null) {
      const defaultValue = getDefaultValue(field);
      if (defaultValue !== undefined) {
        handleChange(defaultValue);
      }
    }
  });

  function getDefaultValue(field: FieldDefinition): unknown {
    switch (field.type) {
      case "boolean":
        return false;
      case "number":
        return 0;
      case "multiselect":
        return [];
      case "richtext":
        return "";
      default:
        return "";
    }
  }
</script>

{#if FieldComponent}
  <div class="field-wrapper {field.ui?.width === 'full' ? 'col-span-full' : ''}">
    <FieldComponent
      {field}
      bind:value
      {error}
      onchange={(e: Event) => {
        const target = e.target as HTMLInputElement;
        if (field.type === "boolean") {
          handleChange(target.checked);
        } else if (field.type === "number") {
          handleChange(Number(target.value));
        } else {
          handleChange(target.value);
        }
      }}
    />
  </div>
{:else}
  <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p class="text-sm text-yellow-800">
      Field type "{field.type}" is not yet supported.
    </p>
  </div>
{/if}
