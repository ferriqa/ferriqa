export async function load() {
  // Mock data - replace with actual API call
  const blueprints = [
    { id: "1", name: "Blog Post", slug: "blog-post" },
    { id: "2", name: "Product", slug: "product" },
  ];

  return {
    blueprints,
  };
}
