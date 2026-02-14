# Preline UI Quick Reference

> Usage with SvelteKit: `npm i preline` + `@tailwindcss/forms`

---

## 📦 Components (Usage)

### Button

```svelte
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline-secondary">Outline</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

### Input

```svelte
<input type="text" class="form-control" placeholder="Text input" />
<input type="email" class="form-control" placeholder="Email input" />
<input type="password" class="form-control" placeholder="Password" />
<textarea class="form-control" rows="4"></textarea>
```

### Select

```svelte
<select class="form-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Checkbox & Radio

```svelte
<div class="form-check">
  <input type="checkbox" class="form-check-input" id="check" />
  <label class="form-check-label" for="check">Checkbox</label>
</div>

<div class="form-check">
  <input type="radio" class="form-check-input" name="radio" />
  <label class="form-check-label">Radio 1</label>
</div>
```

### Switch

```svelte
<div class="form-check form-switch">
  <input type="checkbox" class="form-check-input" id="switch" />
  <label class="form-check-label" for="switch">Switch</label>
</div>
```

### Card

```svelte
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Title</h5>
    <p class="card-text">Content</p>
  </div>
</div>
```

### Badge

```svelte
<span class="badge bg-primary">Primary</span>
<span class="badge bg-secondary">Secondary</span>
<span class="badge bg-outline-primary">Outline</span>
```

### Alert

```svelte
<div class="alert alert-primary">Primary alert</div>
<div class="alert alert-success">Success alert</div>
<div class="alert alert-warning">Warning alert</div>
<div class="alert alert-danger">Danger alert</div>
<div class="alert alert-dismissible">Dismissible ×</div>
```

### Modal

```svelte
<div class="modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">Content</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary">Close</button>
        <button type="button" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>
```

### Dropdown

```svelte
<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
    Dropdown
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Action</a></li>
    <li><a class="dropdown-item" href="#">Another</a></li>
  </ul>
</div>
```

### Tabs

```svelte
<ul class="nav nav-pills" role="tablist">
  <li class="nav-item">
    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab1">Tab 1</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab2">Tab 2</button>
  </li>
</ul>
<div class="tab-content">
  <div class="tab-pane fade show active" id="tab1">Content 1</div>
  <div class="tab-pane fade" id="tab2">Content 2</div>
</div>
```

### Accordion

```svelte
<div class="accordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button">Header</button>
    </h2>
    <div class="accordion-collapse collapse show">
      <div class="accordion-body">Content</div>
    </div>
  </div>
</div>
```

### Progress

```svelte
<div class="progress">
  <div class="progress-bar" style="width: 50%"></div>
</div>
<div class="progress">
  <div class="progress-bar bg-success" style="width: 25%">25%</div>
</div>
```

### Spinner

```svelte
<div class="spinner-border text-primary"></div>
<div class="spinner-border spinner-border-sm"></div>
<div class="spinner-grow"></div>
```

### Toast

```svelte
<div class="toast show">
  <div class="toast-header">
    <strong class="me-auto">Title</strong>
    <button type="button" class="btn-close"></button>
  </div>
  <div class="toast-body">Message</div>
</div>
```

### Avatar

```svelte
<img src="/avatar.jpg" class="avatar" alt="Avatar" />
<img src="/avatar.jpg" class="avatar avatar-sm" alt="Small" />
<img src="/avatar.jpg" class="avatar avatar-lg" alt="Large" />
<span class="avatar avatar-status online"></span>
```

### Collapse

```svelte
<button class="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#collapse">
  Toggle
</button>
<div class="collapse" id="collapse">
  <div class="card card-body">Content</div>
</div>
```

### Offcanvas

```svelte
<button class="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#offcanvas">
  Open
</button>
<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvas">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">Title</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">Content</div>
</div>
```

---

## 🎨 Dark Mode

```html
<!-- Toggle with JS -->
<html data-theme="dark">
  <!-- Or use dark class -->
  <div class="dark:bg-slate-900 dark:text-white"></div>
</html>
```

---

## 📋 Form States

```svelte
<!-- Disabled -->
<input class="form-control" disabled />

<!-- Readonly -->
<input class="form-control" readonly />

<!-- Validation -->
<input class="form-control is-valid" />
<input class="form-control is-invalid" />
<div class="valid-feedback">Valid!</div>
<div class="invalid-feedback">Invalid!</div>
```

---

## 🔧 JavaScript (In Svelte)

Manually init Preline JS in Svelte:

```svelte
<script>
  import { onMount } from 'svelte';
  import HSStaticMethods from 'preline/staticMethods';
  import HSAccordion from 'preline/accordion';

  onMount(() => {
    HSStaticMethods.autoInit();
  });
</script>
```

---

## 🎯 Utility Classes

| Class                            | Description        |
| -------------------------------- | ------------------ |
| `text-primary`                   | Primary text color |
| `bg-primary`                     | Primary background |
| `border`                         | Border             |
| `shadow-sm`, `shadow-lg`         | Box shadows        |
| `rounded`, `rounded-lg`          | Border radius      |
| `d-flex`                         | Flexbox            |
| `justify-content-between`        | Flex justify       |
| `align-items-center`             | Flex align         |
| `gap-2`, `gap-4`                 | Gap                |
| `m-0`, `mt-2`, `mb-3`, `mx-auto` | Margin             |
| `p-0`, `pt-2`, `pb-3`, `px-4`    | Padding            |

---

> Full documentation: https://preline.co
