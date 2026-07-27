// ── Blog: load markdown, render HTML, scrollspy ──

const marked = window.marked || (await import('marked')).marked;
const DOMPurify = window.DOMPurify || (await import('dompurify')).default;

export async function initBlog() {
  const container = document.getElementById('blog-content');
  if (!container) return;

  // Render inline chapter if no fetch (works file:// too)
  const posts = await fetchPosts();
  if (posts.length === 0) {
    container.innerHTML = '<p class="level-tag">Chapter 0</p><h1>Blackbox</h1><p>No posts yet.</p>';
    return;
  }

  let html = '';
  for (const [slug, md] of posts) {
    html += renderPost(slug, md);
  }
  container.innerHTML = html;

  // Activate scrollspy after a frame
  requestAnimationFrame(initScrollspy);
}

async function fetchPosts() {
  const posts = [];
  const slugs = ['00-blackbox'];

  for (const slug of slugs) {
    try {
      const res = await fetch(`/posts/${slug}.md`);
      if (res.ok) {
        const md = await res.text();
        posts.push([slug, md]);
      }
    } catch {
      // silently skip missing files
    }
  }
  return posts;
}

function renderPost(slug, md) {
  const raw = marked.parse(md);
  const clean = DOMPurify.sanitize(raw);
  return `<section class="chapter" id="${slug}" data-chapter="${slug}">${clean}</section>`;
}

function initScrollspy() {
  const chapters = document.querySelectorAll('.chapter');
  if (!chapters.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        chapters.forEach((c) => c.classList.remove('active'));
        if (e.isIntersecting) {
          e.target.classList.add('active');
          window.dispatchEvent(new CustomEvent('chapter-visible', { detail: e.target.dataset.chapter }));
        }
      });
    },
    { rootMargin: '-35% 0px -60% 0px', threshold: 0 },
  );

  chapters.forEach((ch) => obs.observe(ch));
}
