import { createTravels } from "travels";

/** @typedef {import('../components/blueprint/types.ts').FieldDefinition} FieldDefinition */
/** @typedef {import('../components/blueprint/types.ts').FieldType} FieldType */
/** @typedef {import('../components/blueprint/types.ts').Blueprint} Blueprint */

const INITIAL_STATE = {
  name: "",
  slug: "",
  description: "",
  fields: /** @type {FieldDefinition[]} */ ([]),
  settings: {
    draftMode: true,
    versioning: true,
    defaultStatus: /** @type {const} */ ("draft"),
  },
  selectedFieldId: /** @type {string | null} */ (null),
};

// Track if user manually edited the slug
let isSlugManuallyEdited = $state(false);

// Create travels instance with manual archive mode
const travels = createTravels(INITIAL_STATE, {
  maxHistory: 50,
  autoArchive: false, // Manual archive mode
});

// Reactive state - synced with travels via subscription
let currentState = $state(travels.getState());
let currentPosition = $state(travels.getPosition());

// Subscribe to travels changes to keep reactive state in sync
const unsubscribe = travels.subscribe((newState, patches, position) => {
  currentState = newState;
  currentPosition = position;
});

/**
 * Generate URL-friendly slug from name
 * @param {string} name - The field/blueprint name
 * @returns {string} The generated slug
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Archive current state to history
function archive() {
  travels.archive();
}

// Actions for text inputs - only update state, don't archive
// Archive is triggered on blur via forceArchive()

/**
 * Set blueprint name and auto-generate slug if not manually edited
 * @param {string} name - The new blueprint name
 * @returns {void}
 */
export function setBlueprintName(name) {
  travels.setState((draft) => {
    draft.name = name;
    // Auto-generate slug continuously (unless manually edited)
    if (!isSlugManuallyEdited) {
      draft.slug = generateSlug(name);
    }
  });
}

/**
 * Set blueprint slug and mark as manually edited
 * @param {string} slug - The new blueprint slug
 * @returns {void}
 */
export function setBlueprintSlug(slug) {
  travels.setState((draft) => {
    draft.slug = slug;
  });
  // Mark as manually edited when user types in slug field
  isSlugManuallyEdited = true;
}

/**
 * Set blueprint description
 * @param {string} description - The new description
 * @returns {void}
 */
export function setBlueprintDescription(description) {
  travels.setState((draft) => {
    draft.description = description;
  });
}

/**
 * Force archive immediately (for blur events on text inputs)
 * @returns {void}
 */
export function forceArchive() {
  archive();
}

/**
 * Add a new field to the blueprint
 * @param {FieldType} type - The field type
 * @returns {void}
 */
export function addField(type) {
  travels.setState((draft) => {
    /** @type {FieldDefinition} */
    const newField = {
      id: crypto.randomUUID(),
      name: `New Field`,
      key: `field_${draft.fields.length + 1}`,
      type: type,
      required: false,
      options: {},
      ui: { width: "half" },
      validation: {},
    };
    draft.fields = [...draft.fields, newField];
    draft.selectedFieldId = newField.id;
  });
  archive();
}

/**
 * Remove a field by ID
 * @param {string} fieldId - The field ID to remove
 * @returns {void}
 */
export function removeField(fieldId) {
  travels.setState((draft) => {
    draft.fields = draft.fields.filter((f) => f.id !== fieldId);
    if (draft.selectedFieldId === fieldId) {
      draft.selectedFieldId = null;
    }
  });
  archive();
}

/**
 * Duplicate an existing field
 * @param {string} fieldId - The field ID to duplicate
 * @returns {void}
 */
export function duplicateField(fieldId) {
  travels.setState((draft) => {
    const field = draft.fields.find((f) => f.id === fieldId);
    if (field) {
      /** @type {FieldDefinition} */
      const newField = {
        ...field,
        id: crypto.randomUUID(),
        name: `${field.name} (Copy)`,
        key: `${field.key}_copy`,
      };
      draft.fields = [...draft.fields, newField];
      draft.selectedFieldId = newField.id;
    }
  });
  archive();
}

/**
 * Select a field (does not archive to history)
 * @param {string} fieldId - The field ID to select
 * @returns {void}
 */
export function selectField(fieldId) {
  travels.setState((draft) => {
    draft.selectedFieldId = fieldId;
  });
  // Selection changes are not added to history
}

/**
 * Update a field with partial updates
 * @param {string} fieldId - The field ID to update
 * @param {Partial<FieldDefinition>} updates - The updates to apply
 * @returns {void}
 */
export function updateField(fieldId, updates) {
  travels.setState((draft) => {
    const index = draft.fields.findIndex((f) => f.id === fieldId);
    if (index >= 0) {
      draft.fields = [
        ...draft.fields.slice(0, index),
        { ...draft.fields[index], ...updates },
        ...draft.fields.slice(index + 1),
      ];
    }
  });
  archive();
}

/**
 * Reorder fields in the blueprint
 * @param {FieldDefinition[]} fields - The reordered fields array
 * @returns {void}
 */
export function reorderFields(fields) {
  travels.setState((draft) => {
    draft.fields = fields;
  });
  archive();
}

/**
 * Update a blueprint setting
 * @param {string} key - The setting key
 * @param {unknown} value - The setting value
 * @returns {void}
 */
export function setSetting(key, value) {
  travels.setState((draft) => {
    draft.settings[key] = value;
  });
  archive();
}

/**
 * Reset the blueprint state to initial
 * @returns {void}
 */
export function reset() {
  travels.reset();
  isSlugManuallyEdited = false;
}

/**
 * Load an existing blueprint into the editor
 * @param {Blueprint} blueprint - The blueprint to load
 * @returns {void}
 */
export function loadBlueprint(blueprint) {
  travels.setState((draft) => {
    draft.name = blueprint.name || "";
    draft.slug = blueprint.slug || "";
    draft.description = blueprint.description || "";
    draft.fields = blueprint.fields || [];
    draft.settings = {
      ...draft.settings,
      ...blueprint.settings,
    };
    draft.selectedFieldId = null;
  });
  isSlugManuallyEdited = true;
  archive();
}

// Undo/Redo - using travels directly

/**
 * Undo the last action
 * @returns {void}
 */
export function undo() {
  travels.back();
}

/**
 * Redo the previously undone action
 * @returns {void}
 */
export function redo() {
  travels.forward();
}

/**
 * Get the current blueprint state
 * @returns {typeof INITIAL_STATE} The current state
 */
export function getState() {
  return currentState;
}

/**
 * Check if undo is available
 * @returns {boolean} True if undo is possible
 */
export function getCanUndo() {
  return currentPosition > 0;
}

/**
 * Check if redo is available
 * @returns {boolean} True if redo is possible
 */
export function getCanRedo() {
  return currentPosition < travels.getHistory().length - 1;
}

/**
 * Get undo/redo control functions
 * @returns {{back: () => void, forward: () => void}} Control functions
 */
export function getControls() {
  return {
    back: undo,
    forward: redo,
  };
}

/**
 * Cleanup function for hot reload
 * @returns {void}
 */
export function cleanup() {
  unsubscribe();
}
