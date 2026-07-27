export function initBlog(onScene) {
  const blogEl = document.getElementById('blog');
  const secs = [...document.querySelectorAll('.sec[data-scene]')];

  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      secs.forEach(s => s.classList.toggle('active', s === e.target));
      onScene(e.target.dataset.scene);
    }
  }), { root: blogEl, rootMargin: '-35% 0px -55% 0px' });
  secs.forEach(s => spy.observe(s));

  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { root: blogEl, threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => rio.observe(el));
}
