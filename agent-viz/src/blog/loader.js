// ponytail: md→html bridge — fetch, marked, DOMPurify, scrollspy
export async function initBlog() {
  const container = document.getElementById('blog-content');
  if (!container) return;

  // Load all posts
  const postFiles = await fetchPosts();
  let html = '';
  for (const [slug, md] of postFiles) {
    const rendered = renderMarkdown(md);
    html += `<section class="chapter" id="${slug}" data-chapter="${slug}">${rendered}</section>`;
  }
  container.innerHTML = html;

  // Scrollspy
  initScrollspy();
}

async function fetchPosts() {
  const posts = [];
  const slugs = [
    'architecture',
    'react-cycle',
    'memory',
    'tools',
    'multiagent',
  ];

  for (const slug of slugs) {
    try {
      const res = await fetch(`/posts/${slug}.md`);
      if (res.ok) {
        const md = await res.text();
        posts.push([slug, md]);
      }
    } catch {
      // Post not found — skip
    }
  }
  return posts;
}

function renderMarkdown(md) {
  // ponytail: use DOMPurify + marked — no custom parser
  const raw = marked.parse(md);
  return DOMPurify.sanitize(raw);
}

function initScrollspy() {
  const chapters = document.querySelectorAll('.chapter');
  if (!chapters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          chapters.forEach((c) => c.classList.remove('highlight'));
          entry.target.classList.add('highlight');
          const chapter = entry.target.dataset.chapter;
          window.dispatchEvent(new CustomEvent('chapter-visible', { detail: chapter }));
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );

  chapters.forEach((ch) => observer.observe(ch));
}
