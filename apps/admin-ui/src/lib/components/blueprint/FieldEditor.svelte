<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { FieldDefinition, Blueprint } from './types.js';
  import { getFieldType, getValidationRulesForType } from './fieldTypes.js';
  import { updateField } from '$lib/stores/blueprintStore.svelte.js';
  import RelationConfigurator from './RelationConfigurator.svelte';
  import FieldOptionsEditor from './FieldOptionsEditor.svelte';
  import { createUniqueId } from '$lib/utils/uniqueId';

  interface Props {
    field: FieldDefinition;
    availableBlueprints?: Blueprint[];
    allFields?: FieldDefinition[]; // For slug source field selector
  }

  let { field, availableBlueprints = [], allFields = [] }: Props = $props();

  // Generate unique IDs for this component instance
  const instanceId = createUniqueId('field-editor');

  // Get text fields for slug source
  const textFields = $derived(
    allFields.filter(f => f.type === 'text' || f.type === 'textarea')
  );

  const fieldType = $derived(getFieldType(field.type));

  // Keep local state for form inputs but sync properly
  let localField = $state<FieldDefinition>({} as FieldDefinition);

  // Generate unique IDs for all form elements
  const fieldNameId = $derived(`${instanceId}-name`);
  const fieldTypeId = $derived(`${instanceId}-type`);
  const fieldKeyId = $derived(`${instanceId}-key`);
  const fieldPlaceholderId = $derived(`${instanceId}-placeholder`);
  const fieldWidthId = $derived(`${instanceId}-width`);
  const validationMinLengthId = $derived(`${instanceId}-min-length`);
  const validationMaxLengthId = $derived(`${instanceId}-max-length`);
  const validationMinValueId = $derived(`${instanceId}-min-value`);
  const validationMaxValueId = $derived(`${instanceId}-max-value`);
  const validationMinDateId = $derived(`${instanceId}-min-date`);
  const validationMaxDateId = $derived(`${instanceId}-max-date`);
  const validationMinItemsId = $derived(`${instanceId}-min-items`);
  const validationMaxItemsId = $derived(`${instanceId}-max-items`);
  const validationPatternId = $derived(`${instanceId}-pattern`);
  const validationMaxFileSizeId = $derived(`${instanceId}-max-file-size`);
  const validationMaxCharsId = $derived(`${instanceId}-max-chars`);
  const validationRequiredErrorId = $derived(`${instanceId}-required-error`);
  const validationLengthErrorId = $derived(`${instanceId}-length-error`);
  const validationPatternErrorId = $derived(`${instanceId}-pattern-error`);
  const validationRangeErrorId = $derived(`${instanceId}-range-error`);
  const validationMaxId = $derived(`${instanceId}-max`);
  const validationMinId = $derived(`${instanceId}-min`);

  // Watch for prop changes and sync local state
  $effect(() => {
    localField = { ...field };
  });

  function handleUpdate() {
    updateField(field.id, localField);
  }

  function handleKeyChange() {
    const newKey = localField.key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    // Prevent empty keys
    localField.key = newKey || `field_${Date.now()}`;
    handleUpdate();
  }

  // Helper to ensure ui object exists
  function ensureUi() {
    if (!localField.ui) {
      localField.ui = { width: 'half' };
    }
  }

  // Helper to ensure validation object exists
  function ensureValidation() {
    if (!localField.validation) {
      localField.validation = {};
    }
  }

  // Helper to ensure validation.messages exists
  function ensureValidationMessages() {
    ensureValidation();
    if (!localField.validation!.messages) {
      localField.validation!.messages = {};
    }
  }

  // Get available validation rules for this field type
  const availableValidationRules = $derived(getValidationRulesForType(field.type));

  // Check if a specific validation rule is available for this field type
  function hasValidationRule(ruleId: string): boolean {
    return availableValidationRules.includes(ruleId);
  }
</script>

<div class="space-y-6">
  <!-- Basic Info -->
  <div>
    <h4 class="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
    <div class="space-y-4">
      <!-- Field Name -->
      <div>
        <label for={fieldNameId} class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_field_name()}
          <span class="text-red-500">*</span>
        </label>
        <input
          id={fieldNameId}
          type="text"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.name}
          oninput={(e) => {
            localField.name = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder="Enter field name"
        />
      </div>

      <!-- Field Key -->
      <div>
        <label for={fieldKeyId} class="block text-sm font-medium text-gray-700 mb-1">
          API Key
          <span class="text-red-500">*</span>
        </label>
        <input
          id={fieldKeyId}
          type="text"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
          value={localField.key}
          oninput={(e) => {
            localField.key = e.currentTarget.value;
            handleKeyChange();
          }}
          placeholder="e.g., blog_title"
        />
        <p class="text-xs text-gray-500 mt-1">
          Used in API responses and database schema
        </p>
      </div>

      <!-- Field Type -->
      <div>
        <label for={fieldTypeId} class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_field_type()}
        </label>
        <div id={fieldTypeId} class="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600" role="status" aria-live="polite">
          {(m as any)[fieldType?.name || ('field_' + field.type)]?.() || field.type}
        </div>
      </div>

      <!-- Field Type -->
      <div>
        <label for="field-type-display" class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_field_type()}
        </label>
        <div id="field-type-display" class="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600" role="status" aria-live="polite">
          {(m as any)[fieldType?.name || ('field_' + field.type)]?.() || field.type}
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for={`${instanceId}-description`} class="block text-sm font-medium text-gray-700 mb-1">
          {m.common_description()}
        </label>
        <textarea
          id={`${instanceId}-description`}
          rows="2"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.description}
          oninput={(e) => {
            localField.description = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder="Optional description for this field"
        ></textarea>
      </div>
    </div>
  </div>

  <!-- Validation Rules -->
  <div>
    <h4 class="text-sm font-semibold text-gray-900 mb-3">
      {m.blueprint_builder_validation()}
    </h4>
    
    <!-- Required & Unique -->
    <div class="space-y-3 mb-4">
      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={localField.required}
          onchange={(e) => {
            localField.required = e.currentTarget.checked;
            handleUpdate();
          }}
        />
        <span class="text-sm font-medium text-gray-900">
          {m.blueprint_builder_required()}
        </span>
      </label>

      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={localField.unique}
          onchange={(e) => {
            localField.unique = e.currentTarget.checked;
            handleUpdate();
          }}
        />
        <span class="text-sm font-medium text-gray-900">
          {m.blueprint_builder_unique()}
        </span>
      </label>
    </div>

    <!-- Field-Specific Validation Rules -->
    <div class="space-y-4 border-t border-gray-200 pt-4">
      
      <!-- Min/Max Length (for text fields) -->
      {#if hasValidationRule('minLength') || hasValidationRule('maxLength')}
        <div class="grid grid-cols-2 gap-3">
          {#if hasValidationRule('minLength')}
            <div>
              <label for={validationMinLengthId} class="block text-xs font-medium text-gray-600 mb-1">
                Min Length
              </label>
              <input
                id={validationMinLengthId}
                type="number"
                min="0"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.minLength || ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.minLength = value ? parseInt(value) : undefined;
                  handleUpdate();
                }}
                placeholder="0"
              />
            </div>
          {/if}
          {#if hasValidationRule('maxLength')}
            <div>
              <label for={validationMaxLengthId} class="block text-xs font-medium text-gray-600 mb-1">
                Max Length
              </label>
              <input
                id={validationMaxLengthId}
                type="number"
                min="1"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.maxLength || ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.maxLength = value ? parseInt(value) : undefined;
                  handleUpdate();
                }}
                placeholder="100"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Min/Max Value (for number fields) -->
      {#if hasValidationRule('min') || hasValidationRule('max')}
        <div class="grid grid-cols-2 gap-3">
          {#if hasValidationRule('min')}
            <div>
              <label for={validationMinValueId} class="block text-xs font-medium text-gray-600 mb-1">
                Min Value
              </label>
              <input
                id={validationMinValueId}
                type="number"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.min ?? ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.min = value ? parseFloat(value) : undefined;
                  handleUpdate();
                }}
                placeholder="0"
              />
            </div>
          {/if}
          {#if hasValidationRule('max')}
            <div>
              <label for={validationMaxId} class="block text-xs font-medium text-gray-600 mb-1">
                Max Value
              </label>
              <input
                id={validationMaxId}
                type="number"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.max ?? ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.max = value ? parseFloat(value) : undefined;
                  handleUpdate();
                }}
                placeholder="100"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Min/Max Date (for date fields) -->
      {#if hasValidationRule('minDate') || hasValidationRule('maxDate')}
        <div class="grid grid-cols-2 gap-3">
          {#if hasValidationRule('minDate')}
            <div>
              <label for={validationMinDateId} class="block text-xs font-medium text-gray-600 mb-1">
                Min Date
              </label>
              <input
                id={validationMinDateId}
                type="date"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.minDate || ''}
                oninput={(e) => {
                  ensureValidation();
                  localField.validation!.minDate = e.currentTarget.value || undefined;
                  handleUpdate();
                }}
              />
            </div>
          {/if}
          {#if hasValidationRule('maxDate')}
            <div>
              <label for={validationMaxDateId} class="block text-xs font-medium text-gray-600 mb-1">
                Max Date
              </label>
              <input
                id={validationMaxDateId}
                type="date"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.maxDate || ''}
                oninput={(e) => {
                  ensureValidation();
                  localField.validation!.maxDate = e.currentTarget.value || undefined;
                  handleUpdate();
                }}
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Min/Max Items (for multiselect and media) -->
      {#if hasValidationRule('minItems') || hasValidationRule('maxItems')}
        <div class="grid grid-cols-2 gap-3">
          {#if hasValidationRule('minItems')}
            <div>
              <label for={validationMinItemsId} class="block text-xs font-medium text-gray-600 mb-1">
                Min Items
              </label>
              <input
                id={validationMinItemsId}
                type="number"
                min="0"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.minItems || ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.minItems = value ? parseInt(value) : undefined;
                  handleUpdate();
                }}
                placeholder="0"
              />
            </div>
          {/if}
          {#if hasValidationRule('maxItems')}
            <div>
              <label for={validationMaxItemsId} class="block text-xs font-medium text-gray-600 mb-1">
                Max Items
              </label>
              <input
                id={validationMaxItemsId}
                type="number"
                min="1"
                class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                value={localField.validation?.maxItems || ''}
                oninput={(e) => {
                  ensureValidation();
                  const value = e.currentTarget.value;
                  localField.validation!.maxItems = value ? parseInt(value) : undefined;
                  handleUpdate();
                }}
                placeholder="10"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Pattern (for text, textarea, slug) -->
      {#if hasValidationRule('pattern')}
        <div>
          <label for={validationPatternId} class="block text-xs font-medium text-gray-600 mb-1">
            Pattern (Regex)
          </label>
          <input
            id={validationPatternId}
            type="text"
            class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
            value={localField.validation?.pattern || ''}
            oninput={(e) => {
              ensureValidation();
              localField.validation!.pattern = e.currentTarget.value || undefined;
              handleUpdate();
            }}
            placeholder="^[a-zA-Z0-9]+$"
          />
          <p class="text-xs text-gray-500 mt-1">Regular expression pattern for validation</p>
        </div>
      {/if}

      <!-- Max File Size (for media) -->
      {#if hasValidationRule('maxFileSize')}
        <div>
          <label for={validationMaxFileSizeId} class="block text-xs font-medium text-gray-600 mb-1">
            Max File Size (MB)
          </label>
          <input
            id={validationMaxFileSizeId}
            type="number"
            min="0.1"
            step="0.1"
            class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            value={localField.validation?.maxFileSize ? localField.validation.maxFileSize / (1024 * 1024) : ''}
            oninput={(e) => {
              ensureValidation();
              const value = e.currentTarget.value;
              localField.validation!.maxFileSize = value ? parseFloat(value) * 1024 * 1024 : undefined;
              handleUpdate();
            }}
            placeholder="5"
          />
        </div>
      {/if}

      <!-- Max Characters (for richtext) -->
      {#if hasValidationRule('maxChars')}
        <div>
          <label for={validationMaxCharsId} class="block text-xs font-medium text-gray-600 mb-1">
            Max Characters
          </label>
          <input
            id={validationMaxCharsId}
            type="number"
            min="1"
            class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            value={localField.validation?.maxChars || ''}
            oninput={(e) => {
              ensureValidation();
              const value = e.currentTarget.value;
              localField.validation!.maxChars = value ? parseInt(value) : undefined;
              handleUpdate();
            }}
            placeholder="5000"
          />
        </div>
      {/if}

      <!-- Custom Error Messages -->
      {#if hasValidationRule('messages')}
        <div class="border-t border-gray-200 pt-4 mt-4">
          <h5 class="text-xs font-semibold text-gray-700 mb-3">Custom Error Messages</h5>
          <div class="space-y-3">
            {#if localField.required}
              <div>
                <label for={validationRequiredErrorId} class="block text-xs font-medium text-gray-600 mb-1">
                  Required Error
                </label>
                <input
                  id={validationRequiredErrorId}
                  type="text"
                  class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={localField.validation?.messages?.required || ''}
                  oninput={(e) => {
                    ensureValidationMessages();
                    localField.validation!.messages!.required = e.currentTarget.value || undefined;
                    handleUpdate();
                  }}
                  placeholder="This field is required"
                />
              </div>
            {/if}
            
            {#if hasValidationRule('minLength') || hasValidationRule('maxLength')}
              <div>
                <label for={validationLengthErrorId} class="block text-xs font-medium text-gray-600 mb-1">
                  Length Error
                </label>
                <input
                  id={validationLengthErrorId}
                  type="text"
                  class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={localField.validation?.messages?.minLength || localField.validation?.messages?.maxLength || ''}
                  oninput={(e) => {
                    ensureValidationMessages();
                    const value = e.currentTarget.value;
                    if (hasValidationRule('minLength')) {
                      localField.validation!.messages!.minLength = value || undefined;
                    }
                    if (hasValidationRule('maxLength')) {
                      localField.validation!.messages!.maxLength = value || undefined;
                    }
                    handleUpdate();
                  }}
                  placeholder="Invalid length"
                />
              </div>
            {/if}

            {#if hasValidationRule('pattern')}
              <div>
                <label for={validationPatternErrorId} class="block text-xs font-medium text-gray-600 mb-1">
                  Pattern Error
                </label>
                <input
                  id={validationPatternErrorId}
                  type="text"
                  class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={localField.validation?.messages?.pattern || ''}
                  oninput={(e) => {
                    ensureValidationMessages();
                    localField.validation!.messages!.pattern = e.currentTarget.value || undefined;
                    handleUpdate();
                  }}
                  placeholder="Invalid format"
                />
              </div>
            {/if}

            {#if hasValidationRule('min') || hasValidationRule('max')}
              <div>
                <label for={validationRangeErrorId} class="block text-xs font-medium text-gray-600 mb-1">
                  Range Error
                </label>
                <input
                  id={validationRangeErrorId}
                  type="text"
                  class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={localField.validation?.messages?.min || localField.validation?.messages?.max || ''}
                  oninput={(e) => {
                    ensureValidationMessages();
                    const value = e.currentTarget.value;
                    if (hasValidationRule('min')) {
                      localField.validation!.messages!.min = value || undefined;
                    }
                    if (hasValidationRule('max')) {
                      localField.validation!.messages!.max = value || undefined;
                    }
                    handleUpdate();
                  }}
                  placeholder="Value out of range"
                />
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- UI Options -->
  <div>
    <h4 class="text-sm font-semibold text-gray-900 mb-3">
      {m.blueprint_builder_ui_options()}
    </h4>
    <div class="space-y-4">
      <!-- Width -->
      <div>
        <label for={fieldWidthId} class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_width()}
        </label>
        <select
          id={fieldWidthId}
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.ui?.width || 'half'}
          onchange={(e) => {
            ensureUi();
            localField.ui!.width = e.currentTarget.value as 'half' | 'full';
            handleUpdate();
          }}
        >
          <option value="half">{m.blueprint_builder_width_half()}</option>
          <option value="full">{m.blueprint_builder_width_full()}</option>
        </select>
      </div>

      <!-- Placeholder -->
      <div>
        <label for={fieldPlaceholderId} class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_placeholder()}
        </label>
        <input
          id={fieldPlaceholderId}
          type="text"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.ui?.placeholder || ''}
          oninput={(e) => {
            ensureUi();
            localField.ui!.placeholder = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder="Enter placeholder text"
        />
      </div>

      <!-- Help Text -->
      <div>
        <label for={`${instanceId}-helptext`} class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_help_text()}
        </label>
        <textarea
          id={`${instanceId}-helptext`}
          rows="2"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.ui?.helpText || ''}
          oninput={(e) => {
            ensureUi();
            localField.ui!.helpText = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder="Enter help text for content editors"
        ></textarea>
      </div>

      <!-- Placeholder -->
      <div>
        <label for="field-placeholder" class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_placeholder()}
        </label>
        <input
          id="field-placeholder"
          type="text"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.ui?.placeholder || ''}
          oninput={(e) => {
            ensureUi();
            localField.ui!.placeholder = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder={m.blueprint_builder_placeholder()}
        />
      </div>

      <!-- Help Text -->
      <div>
        <label for="field-helptext" class="block text-sm font-medium text-gray-700 mb-1">
          {m.blueprint_builder_help_text()}
        </label>
        <textarea
          id="field-helptext"
          rows="2"
          class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
          value={localField.ui?.helpText || ''}
          oninput={(e) => {
            ensureUi();
            localField.ui!.helpText = e.currentTarget.value;
            handleUpdate();
          }}
          placeholder={m.blueprint_builder_help_text()}
        ></textarea>
      </div>
    </div>
  </div>

  <!-- Relation Configuration (only for relation fields) -->
  {#if field.type === 'relation'}
    <div class="border-t border-gray-200 pt-6">
      <RelationConfigurator {field} {availableBlueprints} />
    </div>
  {/if}

  <!-- Field Options (Select, MultiSelect, Media) -->
  {#if field.type === 'select' || field.type === 'multiselect' || field.type === 'media'}
    <div class="border-t border-gray-200 pt-6">
      <FieldOptionsEditor {field} />
    </div>
  {/if}

  <!-- Slug Source Field Selector -->
  {#if field.type === 'slug' && textFields.length > 0}
    <div class="border-t border-gray-200 pt-6">
      <h5 class="text-sm font-semibold text-gray-900 mb-3">
        Source Field
      </h5>
      <select
        class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        value={localField.options?.sourceField || ''}
        onchange={(e) => {
          const value = e.currentTarget.value;
          localField.options = {
            ...localField.options,
            sourceField: value || undefined,
          };
          handleUpdate();
        }}
      >
        <option value="">Auto-generate from name</option>
        {#each textFields as textField}
          <option value={textField.key}>{textField.name} ({textField.key})</option>
        {/each}
      </select>
      <p class="text-xs text-gray-500 mt-1">
        Select a text field to auto-generate slug from
      </p>
    </div>
  {/if}
</div>
